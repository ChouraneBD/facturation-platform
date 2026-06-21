import { useLocation, useNavigate } from 'react-router-dom';

export function scrollToPublicSection(sectionId) {
  const element = document.getElementById(sectionId);
  if (!element) return false;
  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  window.history.replaceState(null, '', `#${sectionId}`);
  return true;
}

export function PublicSectionLink({ section, children, className }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleClick = (event) => {
    event.preventDefault();

    if (location.pathname === '/') {
      scrollToPublicSection(section);
      return;
    }

    navigate(`/#${section}`);
  };

  return (
    <a href={`/#${section}`} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
