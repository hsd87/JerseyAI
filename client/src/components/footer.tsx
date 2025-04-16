import { Link } from 'wouter';
import { Container } from '@/components/ui/container';

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <Container>
        <div className="grid gap-8 py-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link to="/" className="font-bold text-xl">
              ProJersey
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              AI-powered sports kit design platform for teams and athletes.
              Create, customize, and order your personalized jerseys quickly and easily.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:col-span-8 lg:grid-cols-3">
            <div>
              <h3 className="text-base font-medium">Design</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link to="/kit-designer" className="text-muted-foreground hover:text-foreground transition-colors">
                    Design Kit
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                    My Designs
                  </Link>
                </li>
                <li>
                  <Link to="/gallery" className="text-muted-foreground hover:text-foreground transition-colors">
                    Design Gallery
                  </Link>
                </li>
                <li>
                  <Link to="/custom-teams" className="text-muted-foreground hover:text-foreground transition-colors">
                    Team Orders
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-base font-medium">Company</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/partner" className="text-muted-foreground hover:text-foreground transition-colors">
                    Partner With Us
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-base font-medium">Legal</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link to="/cookies" className="text-muted-foreground hover:text-foreground transition-colors">
                    Cookies
                  </Link>
                </li>
                <li>
                  <Link to="/licenses" className="text-muted-foreground hover:text-foreground transition-colors">
                    Licenses
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-between border-t py-6 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} ProJersey Inc. All rights reserved.
          </p>
          <div className="mt-4 flex items-center space-x-4 md:mt-0">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Twitter
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Instagram
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}