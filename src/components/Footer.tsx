interface FooterProps {
  onOpenPrivacy: () => void;
  onOpenAbout: () => void;
}

export default function Footer({ onOpenPrivacy, onOpenAbout }: FooterProps) {
  return (
    <footer className="site-footer">
      <button className="site-footer__link" onClick={onOpenAbout} type="button">
        About
      </button>
      <button className="site-footer__link" onClick={onOpenPrivacy} type="button">
        Privacy Policy
      </button>
      <span className="site-footer__copy">
        &copy; {new Date().getFullYear()} Basil Board Games
      </span>
    </footer>
  );
}
