import Animated from "./Animated";
import { quickLinks, sitemapLinks, socialLinks } from "../data/data";
import { MailIcon, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="px-auto relative mt-44 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* row */}
        <div className="flex flex-wrap gap-6 justify-between pb-8">
          {/* column-1 : brand and socials */}
          <div className="flex flex-col items-start text-left">
            <Animated>
              <img src="/assets/logo.svg" alt="logo" />
            </Animated>
            <Animated delay={0.2}>
              <p className="mt-3 text-sm/5.5 text-zinc-600 max-w-81.25">
                Serving freshly prepared dishes with authentic flavours,premium
                ingredients and exceptional hospitality every day.
              </p>
            </Animated>
            <div className="flex items-center gap-1.5 mt-6">
              {socialLinks.map((item, index) => (
                <Animated key={index} delay={index * 0.05}>
                  <a
                    href={item.href}
                    className="size-7.5 rounded-full border border-slate-300 grid place-content-center"
                  >
                    {item.icon}
                  </a>
                </Animated>
              ))}
            </div>
          </div>

          {/* column-2 : Quick links */}
          <div>
            <p className="font-mediu mb-5">Quick Links</p>
            <div className="flex flex-col gap-2.5">
              {quickLinks.map((link, index) => (
                <Animated key={link.name} delay={index * 0.05}>
                  <a
                    href={link.href}
                    className="text-zinc-600 hover:text-zinc-500"
                  >
                    {link.name}
                  </a>
                </Animated>
              ))}
            </div>
          </div>

          {/* column-3 : get in touch */}
          <div>
            <p className="font-mediu mb-5">Get in Touch</p>
            <div className="space-y-2">
              <Animated>
                <a
                  href="malito:hello@example.com"
                  className="flex items-center gap-1 text-zinc-600 hover:text-zinc-300"
                >
                  <MailIcon size={16} className="shrink-0" />
                  hello@example.com
                </a>
              </Animated>
              <Animated delay={0.2}>
                <a
                  href="tel:985-678-1245"
                  className="flex items-center gap-1 text-zinc-600 hover:text-zinc-300"
                >
                  <Phone size={16} className="shrink-0" />
                  985-678-1245
                </a>
              </Animated>
            </div>
          </div>

          {/* column-4 : sitemap */}
          <div>
            <p className="font-mediu mb-5">Sitemap</p>
            <div className="flex flex-col gap-2.5">
              {sitemapLinks.map((link, index) => (
                <Animated key={link.name} delay={index * 0.05}>
                  <a
                    href={link.href}
                    className="text-zinc-600 hover:text-zinc-500"
                  >
                    {link.name}
                  </a>
                </Animated>
              ))}
            </div>
          </div>
        </div>
        {/* bottom bar */}
        <div className="border-t text-zinc-500 border-slate-200 py-4.5 flex justify-between items-center">
          <p>&copy; 2026. All Rights Reserved. </p>
          <p>
            Designed by <a href="#home">The Urban Platter</a>
          </p>
        </div>
      </div>
      {/* watermark-logo-backdrop */}
      <div className="absolute inset-0 text-center select-none -z-1 pointer-events-none">
        <span className="text-[190px] tracking-wide font-urbanist font-semibold text-zinc-100/70">
          Urban Platter
        </span>
      </div>
    </footer>
  );
};

export default Footer;
