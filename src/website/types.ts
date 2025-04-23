export interface Business {
  id: string;
  name: string;
  category: "FOUNDATION" | "INNOVATION" | "RELATIONSHIP" | "KNOWLEDGE";
  description: string;
  status: "active" | "planned" | "development";
  launchDate?: string;
  revenue?: {
    type: "recurring" | "project-based" | "hybrid";
    potential: "low" | "medium" | "high";
  };
  automationLevel: "low" | "medium" | "high";
  startupCost: "low" | "medium" | "high";
  timeToProfit: "immediate" | "3-6 months" | "6-12 months" | "12+ months";
  keyFeatures: string[];
  requirements?: string[];
  integrations?: string[];
}

export interface SiteConfig {
  hero: {
    title: string;
    subtitle: string;
    cta: {
      text: string;
      href: string;
    };
  };

  navigation: {
    categories: Array<{
      title: string;
      items: Array<{
        title: string;
        href: string;
        description?: string;
      }>;
    }>;
    mainLinks: Array<{
      name: string;
      href: string;
    }>;
  };

  directory: {
    views: Array<{
      id: string;
      name: string;
    }>;
    filters: Array<{
      id: string;
      name: string;
      options: Array<{
        value: string;
        label: string;
      }>;
    }>;
    businesses: Business[];
  };

  services: {
    categories: Array<{
      id: string;
      name: string;
      description: string;
      services?: Array<{
        id: string;
        name: string;
        description: string;
        price?: string;
      }>;
    }>;
  };

  education: {
    academy: {
      courses: Array<{
        id: string;
        title: string;
        description: string;
        duration: string;
        level: string;
      }>;
    };
    media: {
      articles: Array<{
        id: string;
        title: string;
        excerpt: string;
        publishDate: string;
        author: string;
      }>;
      videos: Array<{
        id: string;
        title: string;
        description: string;
        url: string;
        duration: string;
      }>;
    };
  };

  community: {
    membership: {
      tiers: Array<{
        id: string;
        name: string;
        price: string;
        features: string[];
      }>;
    };
    legacy: {
      programs: Array<{
        id: string;
        name: string;
        description: string;
        status: "active" | "archived";
      }>;
    };
  };

  integrations: {
    analytics: {
      provider: string;
      trackingId: string;
    };
    payments: {
      provider: string;
      publicKey: string;
    };
    auth: {
      provider: string;
      clientId: string;
    };
  };
}
