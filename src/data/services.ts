import type { IconKey } from "@/components/icons";

export type Service = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  items: string[];
  icon: IconKey;
};

export const services: Service[] = [
  {
    slug: "customized-furniture",
    title: "Customized Furniture",
    icon: "furniture",
    summary:
      "Furniture designed and built around your exact measurements, style, and space.",
    description:
      "We design and manufacture furniture entirely around you — your measurements, your material and finish preferences, your budget, and the exact footprint of your room. Every project starts with understanding how you'll actually use the piece day to day, then moves through design, material selection, and hands-on construction in our own workshop before it's delivered and installed at your home, office, or shop.",
    items: [
      "Customized Chairs",
      "Tables",
      "Beds",
      "Wardrobes",
      "Cabinets",
      "Shelves & Storage Units",
      "Office Furniture",
      "Home Furniture",
      "Special-purpose Furniture",
      "Custom-designed furniture projects",
    ],
  },
  {
    slug: "wonder-creative-furniture",
    title: "Wonder & Creative Furniture",
    icon: "wonder",
    summary:
      "Unique, statement furniture pieces built from a concept, sketch, or idea.",
    description:
      "We create unique and creative furniture pieces that combine design, functionality, comfort, and craftsmanship. From concept to finished product, we develop furniture according to a customer's specific idea, design, or space requirement — whether that's a single conversation-starting piece for a living room or a themed set built around a particular look you have in mind.",
    items: [
      "Concept-to-creation design",
      "One-of-a-kind statement pieces",
      "Themed & decorative furniture",
      "Unusual shapes & materials on request",
      "Space-specific problem solving",
    ],
  },
  {
    slug: "interior-solutions",
    title: "Interior Solutions",
    icon: "interior",
    summary:
      "Turning homes, offices, and shops into functional, visually appealing spaces.",
    description:
      "We provide interior-related services to transform spaces into functional, comfortable, and visually appealing environments. This covers everything from planning the layout and choosing finishes to building and installing the furniture and fixtures that make the space work — so you get one coordinated look rather than pieces bought separately from different places.",
    items: [
      "Residential Interior Work",
      "Office Interior",
      "Shop & Commercial Interior",
      "Kitchen Design & Cabinetry",
      "Furniture Integration",
      "Custom Interior Features",
      "Space Optimization",
      "Interior Finishing & Installation",
    ],
  },
  {
    slug: "exterior-solutions",
    title: "Exterior Solutions",
    icon: "exterior",
    summary:
      "Design, fabrication, and installation that elevate the outside of a property.",
    description:
      "We provide exterior-related design, fabrication, and installation solutions to enhance the functionality and appearance of residential and commercial properties. From structural fabrication to decorative and outdoor furniture pieces, we handle the work needed to make the outside of a space as considered as the inside.",
    items: [
      "Exterior structures",
      "Custom fabrication",
      "Decorative features",
      "Outdoor furniture",
      "Exterior finishing",
      "Installation work",
    ],
  },
  {
    slug: "electrical-house-wiring",
    title: "Electrical & House Wiring",
    icon: "electrical",
    summary:
      "Professional, organized electrical work for homes and commercial spaces.",
    description:
      "We provide professional electrical solutions for residential and commercial spaces, with a focus on clean, safe, and well-organized wiring rather than quick fixes. Whether it's a brand-new installation or repair work on an existing setup, we plan the layout of points, switches, and boards around how the space is actually used.",
    items: [
      "Complete House Wiring",
      "New Electrical Installation",
      "Electrical Repair & Modification",
      "Lighting Installation",
      "Switch & Socket Installation",
      "Distribution Board Installation",
      "Electrical Point Setup",
      "Electrical Equipment Installation",
      "Electrical Maintenance & Troubleshooting",
    ],
  },
  {
    slug: "electrical-machine-equipment",
    title: "Electrical Machine & Equipment Installation",
    icon: "machine",
    summary:
      "Installation, setup, and commissioning of electrical machines to spec.",
    description:
      "We specialize in the installation and setup of electrical machines and equipment according to project requirements — from initial connection and control panel wiring through to testing and commissioning, so equipment is verified working correctly before we consider the job done.",
    items: [
      "Electrical Machine Installation",
      "Electrical Equipment Installation",
      "Machine Connection & Setup",
      "Wiring & Cable Connection",
      "Control Panel Connection",
      "Electrical System Integration",
      "Testing & Commissioning Support",
      "Machine Relocation & Reinstallation",
      "Maintenance and troubleshooting",
    ],
  },
  {
    slug: "fabrication-installation",
    title: "Fabrication & Installation",
    icon: "fabrication",
    summary:
      "Custom fabrication and installation across furniture, interior, and electrical work.",
    description:
      "We provide customized fabrication and installation services for furniture, interior, exterior, and electrical-related projects. Our team works from customer ideas, drawings, measurements, or specific project requirements to deliver practical and customized solutions — including on-site work where a piece needs to be built or fitted directly into its final location.",
    items: [
      "On-site measurement & drawings",
      "Custom fabrication to specification",
      "Professional on-site installation",
      "Multi-trade project coordination",
      "Fitting & finishing work",
    ],
  },
  {
    slug: "custom-project-solutions",
    title: "Custom Project Solutions",
    icon: "custom",
    summary:
      "One integrated solution — from a single table to a complete project.",
    description:
      "Have a specific design or project in mind? We work with customers to understand their requirements and develop a solution based on their space, design, budget, functionality, and technical needs. From a single customized table to a complete interior, electrical, or installation project, Shenjar Crafts aims to provide an integrated solution under one roof — one point of contact from first conversation to final handover.",
    items: [
      "Free initial consultation",
      "Design & budget planning together",
      "Single item to full-project scope",
      "One point of contact throughout",
    ],
  },
];
