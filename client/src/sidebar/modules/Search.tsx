import * as React from 'react';

import { ModuleDefinition, ModuleRenderContext } from '../Sidebar';

const gettext = (text: string) => text;

interface SearchInputProps {
  slim: boolean;
  expandingOrCollapsing: boolean;
  searchUrl: string;
  navigate(url: string): void;
}

export const SearchInput: React.FunctionComponent<SearchInputProps> = ({
  slim,
  expandingOrCollapsing,
  searchUrl,
  navigate,
}) => {
  const isVisible = !slim || expandingOrCollapsing;

  const onSubmitForm = (e: React.FormEvent<HTMLFormElement>) => {
    if (e.target instanceof HTMLFormElement) {
      e.preventDefault();

      if (isVisible) {
        const inputElement = e.target.querySelector(
          'input[name="q"]',
        ) as HTMLInputElement;
        navigate(searchUrl + '?q=' + encodeURIComponent(inputElement.value));
      } else {
        navigate(searchUrl);
      }
    }
  };

  const className =
    'sidebar-search' +
    (slim ? ' sidebar-search--slim' : '') +
    (isVisible ? ' sidebar-search--visible' : '');

  return (
    <form
      role="search"
      className={className}
      action={searchUrl}
      method="get"
      onSubmit={onSubmitForm}
    >
      <label className="sidebar-search__label" htmlFor="menu-search-q">
        {gettext("Search")}
      </label>
      <input
        className="sidebar-search__input"
        type="text"
        id="menu-search-q"
        name="q"
        placeholder={gettext("Search")}
      />
      <button
        className="button sidebar-search__submit"
        type="submit"
        aria-label={gettext("Search")}
      >
        {/* <Icon className="icon--menuitem" name="search" /> */}
      </button>
    </form>
  );
};

export class SearchModuleDefinition implements ModuleDefinition {
  searchUrl: string;

  constructor(searchUrl: string) {
    this.searchUrl = searchUrl;
  }

  render({ slim, key, expandingOrCollapsing, navigate }: ModuleRenderContext) {
    return (
      <SearchInput
        searchUrl={this.searchUrl}
        slim={slim}
        key={key}
        expandingOrCollapsing={expandingOrCollapsing}
        navigate={navigate}
      />
    );
  }
}
