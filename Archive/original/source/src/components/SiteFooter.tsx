import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin, Instagram, Facebook } from "lucide-react";
import logo from "@/assets/luxe-infra-logo.png";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-4">
        <div>
          <img src={logo} alt="Luxe Infra" className="h-14 w-auto" />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Crafting beautiful, functional interiors for modern Indian homes — designed end-to-end with care.
          </p>
          <div className="mt-5 flex gap-3">
            <a href="#" className="rounded-full border border-border p-2 hover:bg-accent"><Instagram className="h-4 w-4" /></a>
            <a href="#" className="rounded-full border border-border p-2 hover:bg-accent"><Facebook className="h-4 w-4" /></a>
          </div>
        </div>
        <div>
          <h4 className="mb-4 font-display text-base">Explore</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/design-ideas" className="hover:text-primary">Design Ideas</Link></li>
            <li><Link to="/services" className="hover:text-primary">Services</Link></li>
            <li><Link to="/projects" className="hover:text-primary">Projects</Link></li>
            <li><Link to="/about" className="hover:text-primary">About Us</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 font-display text-base">Offerings</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Modular Kitchens</li>
            <li>Wardrobes & Storage</li>
            <li>Full Home Interiors</li>
            <li>False Ceilings & Lighting</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 font-display text-base">Get in Touch</h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2"><Phone className="mt-0.5 h-4 w-4 text-primary" /> <a href="tel:9026271638" className="hover:text-primary">+91 90262 71638</a></li>
            <li className="flex items-start gap-2"><Mail className="mt-0.5 h-4 w-4 text-primary" /> <a href="mailto:infoluxeinfra@gmail.com" className="hover:text-primary break-all">infoluxeinfra@gmail.com</a></li>
            <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-primary" /> India</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-5 text-xs text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} Luxe Infra. All rights reserved.</p>
          <p>Designed with care in India.</p>
        </div>
      </div>
    </footer>
  );
}
