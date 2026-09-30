export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "LDCE Placement Portal",
  shortName: "LDCE Placements",
  description:
    "Official Training and Placement Cell Portal for L.D. College of Engineering. Connecting top engineering talent with leading recruiters.",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://placements.ldce.ac.in",
  ogImage: "https://placements.ldce.ac.in/og.jpg",
  author: {
    name: "LDCE Placement Cell",
    website: "https://ldce.ac.in",
  },
  links: {
    officialSite: "https://ldce.ac.in",
    github: "https://github.com/LDCE-Placement-Cell",
  },
  mainNav: [
    { title: "Home", href: "/" },
    { title: "Companies", href: "/companies" },
    { title: "Placements", href: "/placements" },
    { title: "Statistics", href: "/stats" },
    { title: "Contact Us", href: "/contact" },
  ],
};
