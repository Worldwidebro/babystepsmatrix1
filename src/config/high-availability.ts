import { Pool } from "pg";
import Redis from "ioredis";
import { EventEmitter } from "events";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

interface HAConfig {
  readonly mode: "active-active" | "active-passive";
  readonly nodes: number;
  readonly healthCheckInterval: number;
  readonly failoverThreshold: number;
}

interface NodeStatus {
  id: string;
  status: "active" | "standby" | "failed";
  lastHeartbeat: Date;
  metrics: {
    cpu: number;
    memory: number;
    connections: number;
  };
}

export class HighAvailabilityManager extends EventEmitter {
  private config: HAConfig;
  private nodes: Map<string, NodeStatus>;
  private primaryNode: string | null;
  private readonly redis: Redis;
  private readonly pgPool: Pool;
  private readonly supabase: any;

  constructor() {
    super();

    this.config = {
      mode:
        (process.env.HA_MODE as "active-active" | "active-passive") ||
        "active-passive",
      nodes: parseInt(process.env.HA_NODES || "2"),
      healthCheckInterval: parseInt(
        process.env.HA_HEALTH_CHECK_INTERVAL || "5000"
      ),
      failoverThreshold: parseInt(process.env.HA_FAILOVER_THRESHOLD || "3"),
    };

    this.nodes = new Map();
    this.primaryNode = null;

    // Initialize Redis for distributed locking and state management
    this.redis = new Redis(process.env.REDIS_URL || "");

    // Initialize Postgres connection pool
    this.pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 20,
    });

    // Initialize Supabase client
    this.supabase = createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_KEY || ""
    );

    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Register this node
      const nodeId =
        process.env.NODE_ID ||
        `node-${Math.random().toString(36).substr(2, 9)}`;
      await this.registerNode(nodeId);

      // Start health checks
      this.startHealthChecks();

      // Initialize leader election if in active-passive mode
      if (this.config.mode === "active-passive") {
        await this.initializeLeaderElection();
      }

      // Subscribe to node events
      this.subscribeToNodeEvents();
    } catch (error) {
      console.error("Error initializing HA manager:", error);
      throw error;
    }
  }

  private async registerNode(nodeId: string): Promise<void> {
    const node: NodeStatus = {
      id: nodeId,
      status: "standby",
      lastHeartbeat: new Date(),
      metrics: {
        cpu: 0,
        memory: 0,
        connections: 0,
      },
    };

    this.nodes.set(nodeId, node);

    // Register in Redis for distributed state
    await this.redis.hset("ha:nodes", nodeId, JSON.stringify(node));

    console.log(`Node ${nodeId} registered`);
  }

  private startHealthChecks(): void {
    setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error("Health check failed:", error);
      }
    }, this.config.healthCheckInterval);
  }

  private async performHealthCheck(): Promise<void> {
    const nodeId = process.env.NODE_ID;
    if (!nodeId) return;

    try {
      // Check database connectivity
      await this.pgPool.query("SELECT 1");

      // Check Redis connectivity
      await this.redis.ping();

      // Update node metrics
      const metrics = await this.collectNodeMetrics();

      // Update node status
      const node = this.nodes.get(nodeId);
      if (node) {
        node.lastHeartbeat = new Date();
        node.metrics = metrics;

        // Update in Redis
        await this.redis.hset("ha:nodes", nodeId, JSON.stringify(node));
      }

      // Check other nodes' health
      await this.checkNodesHealth();
    } catch (error) {
      console.error("Node health check failed:", error);
      await this.handleNodeFailure(nodeId);
    }
  }

  private async collectNodeMetrics(): Promise<NodeStatus["metrics"]> {
    // Implement actual metric collection
    return {
      cpu: 0,
      memory: 0,
      connections: 0,
    };
  }

  private async checkNodesHealth(): Promise<void> {
    const nodes = await this.redis.hgetall("ha:nodes");

    for (const [nodeId, nodeData] of Object.entries(nodes)) {
      const node: NodeStatus = JSON.parse(nodeData);
      const lastHeartbeat = new Date(node.lastHeartbeat);
      const timeSinceHeartbeat = Date.now() - lastHeartbeat.getTime();

      if (
        timeSinceHeartbeat >
        this.config.healthCheckInterval * this.config.failoverThreshold
      ) {
        await this.handleNodeFailure(nodeId);
      }
    }
  }

  private async handleNodeFailure(nodeId: string): Promise<void> {
    console.log(`Node ${nodeId} failed`);

    // Update node status
    const node = this.nodes.get(nodeId);
    if (node) {
      node.status = "failed";
      await this.redis.hset("ha:nodes", nodeId, JSON.stringify(node));
    }

    // If this was the primary node, initiate failover
    if (this.primaryNode === nodeId) {
      await this.initializeLeaderElection();
    }

    this.emit("nodeFailure", nodeId);
  }

  private async initializeLeaderElection(): Promise<void> {
    const lock = await this.redis.set(
      "ha:leader_lock",
      process.env.NODE_ID,
      "NX",
      "PX",
      this.config.healthCheckInterval * 2
    );

    if (lock) {
      this.primaryNode = process.env.NODE_ID;
      console.log(`Node ${process.env.NODE_ID} is now primary`);
      this.emit("leaderElected", process.env.NODE_ID);
    }
  }

  private subscribeToNodeEvents(): void {
    const subscriber = new Redis(process.env.REDIS_URL || "");

    subscriber.subscribe("ha:events", (err, count) => {
      if (err) {
        console.error("Failed to subscribe to HA events:", err);
        return;
      }
      console.log(`Subscribed to ${count} channel(s)`);
    });

    subscriber.on("message", (channel, message) => {
      try {
        const event = JSON.parse(message);
        this.handleNodeEvent(event);
      } catch (error) {
        console.error("Error handling node event:", error);
      }
    });
  }

  private async handleNodeEvent(event: any): Promise<void> {
    switch (event.type) {
      case "nodeJoined":
        await this.handleNodeJoined(event.nodeId);
        break;
      case "nodeLeft":
        await this.handleNodeLeft(event.nodeId);
        break;
      case "leaderChanged":
        await this.handleLeaderChanged(event.nodeId);
        break;
      default:
        console.warn("Unknown event type:", event.type);
    }
  }

  private async handleNodeJoined(nodeId: string): Promise<void> {
    console.log(`Node ${nodeId} joined the cluster`);
    this.emit("nodeJoined", nodeId);
  }

  private async handleNodeLeft(nodeId: string): Promise<void> {
    console.log(`Node ${nodeId} left the cluster`);
    this.emit("nodeLeft", nodeId);
  }

  private async handleLeaderChanged(nodeId: string): Promise<void> {
    console.log(`Leader changed to node ${nodeId}`);
    this.primaryNode = nodeId;
    this.emit("leaderChanged", nodeId);
  }

  // Public methods for node management
  async getNodeStatus(nodeId: string): Promise<NodeStatus | null> {
    const nodeData = await this.redis.hget("ha:nodes", nodeId);
    return nodeData ? JSON.parse(nodeData) : null;
  }

  async getAllNodes(): Promise<Map<string, NodeStatus>> {
    const nodes = await this.redis.hgetall("ha:nodes");
    const nodeMap = new Map();

    for (const [nodeId, nodeData] of Object.entries(nodes)) {
      nodeMap.set(nodeId, JSON.parse(nodeData));
    }

    return nodeMap;
  }

  isPrimary(): boolean {
    return this.primaryNode === process.env.NODE_ID;
  }

  async promoteToLeader(nodeId: string): Promise<boolean> {
    if (this.config.mode !== "active-passive") {
      throw new Error("Leader promotion only available in active-passive mode");
    }

    const success = await this.redis.set(
      "ha:leader_lock",
      nodeId,
      "XX",
      "PX",
      this.config.healthCheckInterval * 2
    );

    if (success) {
      this.primaryNode = nodeId;
      await this.redis.publish(
        "ha:events",
        JSON.stringify({
          type: "leaderChanged",
          nodeId,
        })
      );
      return true;
    }

    return false;
  }
}
