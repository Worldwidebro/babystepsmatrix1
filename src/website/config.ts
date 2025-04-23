import { SiteConfig } from "./types";
import { generateBusinesses } from "./utils/businessGenerator";

export const siteConfig: SiteConfig = {
  // Site Foundation
  hero: {
    title: "AI Boss Holdings",
    subtitle: "Building the Future of Automated Business Empires",
    cta: {
      text: "Join the Movement",
      href: "/contact",
    },
  },

  // Navigation
  navigation: {
    categories: [
      {
        title: "Foundation Companies",
        items: [
          {
            title: "Cash Flow Businesses",
            href: "/directory/foundation",
            description: "Core infrastructure and essential services",
          },
        ],
      },
      {
        title: "Innovation Companies",
        items: [
          {
            title: "Tech & Automation",
            href: "/directory/innovation",
            description: "Cutting-edge technology and research",
          },
        ],
      },
      {
        title: "Relationship Companies",
        items: [
          {
            title: "Trust & People-Centered",
            href: "/directory/relationship",
            description: "Customer-focused and social enterprises",
          },
        ],
      },
      {
        title: "Knowledge Companies",
        items: [
          {
            title: "IP & Education",
            href: "/directory/knowledge",
            description: "Education and information services",
          },
        ],
      },
    ],
    mainLinks: [
      { name: "Empire Directory", href: "/directory" },
      { name: "Services", href: "/services" },
      { name: "Academy", href: "/academy" },
      { name: "Community", href: "/community" },
    ],
  },

  // Ecosystem Directory
  directory: {
    views: [
      { id: "grid", name: "Grid View" },
      { id: "list", name: "List View" },
    ],
    filters: [
      {
        id: "category",
        name: "Category",
        options: [
          { value: "FOUNDATION", label: "Foundation" },
          { value: "INNOVATION", label: "Innovation" },
          { value: "RELATIONSHIP", label: "Relationship" },
          { value: "KNOWLEDGE", label: "Knowledge" },
        ],
      },
      {
        id: "status",
        name: "Status",
        options: [
          { value: "active", label: "Active" },
          { value: "planned", label: "Planned" },
          { value: "development", label: "In Development" },
        ],
      },
    ],
    businesses: generateBusinesses(),
  },

  // Services & Products
  services: {
    categories: [
      {
        id: "automation",
        name: "Automation Agency",
        description: "End-to-end automation solutions for businesses",
        services: [
          {
            id: "process-automation",
            name: "Process Automation",
            description: "Streamline your business processes",
            price: "Custom",
          },
        ],
      },
    ],
  },

  // Education & Media
  education: {
    academy: {
      courses: [
        {
          id: "automation-mastery",
          title: "Automation Mastery",
          description: "Master business automation",
          duration: "8 weeks",
          level: "Advanced",
        },
      ],
    },
    media: {
      articles: [],
      videos: [],
    },
  },

  // Community & Legacy
  community: {
    membership: {
      tiers: [
        {
          id: "founder",
          name: "Founder",
          price: "$997/month",
          features: ["Private Discord Access", "Monthly Strategy Calls"],
        },
      ],
    },
    legacy: {
      programs: [
        {
          id: "youth-entrepreneurship",
          name: "Youth Entrepreneurship",
          description: "Empowering the next generation",
          status: "active",
        },
      ],
    },
  },

  // Integrations
  integrations: {
    analytics: {
      provider: "Google Analytics",
      trackingId: "UA-XXXXXXXX-X",
    },
    payments: {
      provider: "Stripe",
      publicKey: "pk_test_XXXXXXXXXXXXXXXXXXXXXXXX",
    },
    auth: {
      provider: "Auth0",
      clientId: "XXXXXXXXXXXXXXXXXXXXXXXX",
    },
  },
};
