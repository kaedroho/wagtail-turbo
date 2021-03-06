import * as React from 'react';
import { ModuleDefinition, ModuleRenderContext } from '../Sidebar';

const gettext = (text: string) => text;

export interface LogoImages {
  mobileLogo: string;
  desktopLogoBody: string;
  desktopLogoTail: string;
  desktopLogoEyeOpen: string;
  desktopLogoEyeClosed: string;
}

interface WagtailBrandingProps {
  homeUrl: string;
  images: LogoImages;
  currentPath: string;
  navigate(url: string): void;
}

const WagtailBranding: React.FunctionComponent<WagtailBrandingProps> = ({
  homeUrl,
  images,
  currentPath,
  navigate,
}) => {
  const brandingLogo = React.useMemo(
    () =>
      document.querySelector<HTMLTemplateElement>(
        '[data-wagtail-sidebar-branding-logo]',
      ),
    [],
  );
  const onClick = (e: React.MouseEvent) => {
    // Do not capture click events with modifier keys or non-main buttons.
    if (e.ctrlKey || e.shiftKey || e.metaKey || (e.button && e.button !== 0)) {
      return;
    }

    e.preventDefault();
    navigate(homeUrl);
  };

  // Tail wagging
  // If the pointer changes direction 8 or more times without leaving, wag the tail!
  const lastMouseX = React.useRef(0);
  const lastDir = React.useRef<'r' | 'l'>('r');
  const dirChangeCount = React.useRef(0);
  const [isWagging, setIsWagging] = React.useState(false);

  const onMouseMove = (e: React.MouseEvent) => {
    const mouseX = e.pageX;
    const dir: 'r' | 'l' = mouseX > lastMouseX.current ? 'r' : 'l';

    if (mouseX !== lastMouseX.current && dir !== lastDir.current) {
      dirChangeCount.current += 1;
    }

    if (dirChangeCount.current > 8) {
      setIsWagging(true);
    }

    lastMouseX.current = mouseX;
    lastDir.current = dir;
  };

  const onMouseLeave = () => {
    setIsWagging(false);
    dirChangeCount.current = 0;
  };

  const desktopClassName =
    'sidebar-wagtail-branding' +
    (isWagging ? ' sidebar-wagtail-branding--wagging' : '');


  // Render differently if custom branding is provided.
  // This will only ever render once, so rendering before hooks is ok.
  const hasCustomBranding = brandingLogo && brandingLogo.innerHTML !== '';
  if (hasCustomBranding) {
    return (
      <a
        className="sidebar-custom-branding"
        href={homeUrl}
        aria-label={gettext("Dashboard")}
        aria-current={currentPath === homeUrl ? 'page' : undefined}
        dangerouslySetInnerHTML={{
          __html: brandingLogo ? brandingLogo.innerHTML : '',
        }}
      />
    );
  }

  return (
    <a
      className={desktopClassName}
      href={homeUrl}
      aria-label={gettext("Dashboard")}
      aria-current={currentPath === homeUrl ? 'page' : undefined}
      onClick={onClick}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <div className="sidebar-wagtail-branding__icon-wrapper">
        <img
          className="sidebar-wagtail-branding__icon"
          data-part="body"
          src={images.desktopLogoBody}
          alt=""
        />
        <img
          className="sidebar-wagtail-branding__icon"
          data-part="tail"
          src={images.desktopLogoTail}
          alt=""
        />
        <img
          className="sidebar-wagtail-branding__icon"
          data-part="eye--open"
          src={images.desktopLogoEyeOpen}
          alt=""
        />
        <img
          className="sidebar-wagtail-branding__icon"
          data-part="eye--closed"
          src={images.desktopLogoEyeClosed}
          alt=""
        />
      </div>
    </a>
  );
};

export class WagtailBrandingModuleDefinition implements ModuleDefinition {
  homeUrl: string;
  images: LogoImages;

  constructor(homeUrl: string, images: LogoImages) {
    this.homeUrl = homeUrl;
    this.images = images;
  }

  render({ key, navigate, currentPath }: ModuleRenderContext) {
    return (
      <WagtailBranding
        key={key}
        homeUrl={this.homeUrl}
        images={this.images}
        navigate={navigate}
        currentPath={currentPath}
      />
    );
  }
}
