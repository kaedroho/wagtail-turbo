import React from 'react';
import styled, { css } from 'styled-components';

import Button from './common/Button';
import Icon, { IconProps } from './common/Icon';
import * as mixins from './common/mixins';
import { ExplorerContext, TurboProps } from '../main';
import { initExplorer } from './Explorer';

interface SubmenuTriggerIconProps extends IconProps {
    isOpen: boolean
}
const SubmenuTriggerIcon = styled<React.FunctionComponent<SubmenuTriggerIconProps>>(Icon)`
    display: block;
    width: 1.5em;
    height: 1.5em;
    position: absolute;
    top: 0.8125em;
    right: 0.5em;
    ${mixins.transition('transform 0.3s ease, top 0.3s ease, right 0.3s ease, width 0.3s ease, height 0.3s ease')}

    ${(props) => props.isOpen && css`
        transform-origin: 50% 50%;
        transform: rotate(180deg);
    `}
`;

interface MenuItemWrapperProps {
    isActive: boolean;
    isInSubmenu: boolean;
}

const MenuItemWrapper = styled.li<MenuItemWrapperProps>`
    a {
        position: relative;
        white-space: nowrap;
        border-left: 3px solid transparent;

        &:before {
            font-size: 1rem;
            vertical-align: -15%;
            margin-right: 0.5em;
        }

        // only really used for spinners and settings menu
        &:after {
            font-size: 1.5em;
            margin: 0;
            position: absolute;
            right: 0.5em;
            top: 0.5em;
            margin-top: 0;
        }

        ${(props) => props.isInSubmenu && css`
            white-space: normal;
            padding: 0.9em 1.7em 0.9em 4.5em;

            &:hover {
                background-color: rgba(100, 100, 100, 0.2);
            }
        `}
    }

    ${(props) => props.isActive && css`
        background: #1a1a1a;  // $nav-item-active-bg;
        text-shadow: -1px -1px 0 rgba(0, 0, 0, 0.3);

        > a {
            border-left-color: #f37e77;  // $color-salmon;
            color: #fff;  // $color-white
        }
    `}
`;

interface MenuItemCommon {
    name: string;
    url: string;
    classnames: string;
    icon_name: string;
    attr_string: string;
    label: string;
}

interface MenuItem {
    type: 'item',
    data: MenuItemCommon;
}

interface MenuGroup {
    type: 'group',
    data: MenuItemCommon;
    items: MenuData;
}

type MenuData = (MenuItem | MenuGroup)[];

interface MenuItemProps {
    path: string;
    data: MenuItemCommon;
    state: MenuState;
    dispatch(action: MenuAction): void;
    navigate(url: string): Promise<void>;
}

const ExplorerMenuItem: React.FunctionComponent<MenuItemProps> = ({path, data, state, dispatch, navigate}) => {
    const isOpen = state.navigationPath.startsWith(path);
    const isActive = isOpen || state.activePath.startsWith(path);
    const isInSubmenu = path.split('.').length > 2;
    const [isVisible, setIsVisible] = React.useState(false);

    React.useEffect(() => {
        if (isOpen) {
            // isOpen is set at the moment the user clicks the menu item
            setIsVisible(true);
        } else if (!isOpen && isVisible) {
            // When a submenu is closed, we have to wait for the close animation
            // to finish before making it invisible
            setTimeout(() => {
                setIsVisible(false);
            }, 300);
        }
    }, [isOpen]);

    const closeExplorer = () => {
        dispatch({
            type: 'set-navigation-path',
            path: '',
        });
    };

    const context = React.useContext(ExplorerContext);
    const explorerManager = React.useRef<any>(null);
    React.useEffect(() => {
        const wrapperElement = context?.wrapperRef;
        if (wrapperElement?.current && !explorerManager.current) {
            explorerManager.current = initExplorer(wrapperElement.current, (url: string) => navigate(url).then(closeExplorer));
        }
    }, [context?.wrapperRef]);

    React.useEffect(() => {
        if (isOpen && explorerManager.current) {
            explorerManager.current.open(context.startPageId);

            return () => {
                if (explorerManager.current) {
                    explorerManager.current.close();
                }
            };
        }

    }, [isOpen, explorerManager]);

    const onClick = (e: React.MouseEvent) => {
        e.preventDefault();

        // Open/close explorer
        if (isOpen) {
            dispatch({
                type: 'set-navigation-path',
                path: '',
            });
        } else {
            dispatch({
                type: 'set-navigation-path',
                path,
            });
        }
    }

    return (
        <MenuItemWrapper isActive={isActive} isInSubmenu={isInSubmenu}>
              <Button
                dialogTrigger={true}
                onClick={onClick}
            >
                <Icon name="folder-open-inverse" className="icon--menuitem" />
                    <span className="menuitem-label">{data.label}</span>
                <SubmenuTriggerIcon name="arrow-right" isOpen={isOpen} />
            </Button>
        </MenuItemWrapper>
    );
}

const MenuItem: React.FunctionComponent<MenuItemProps> = ({path, data, state, dispatch, navigate}) => {
    const isActive = state.activePath.startsWith(path);
    const isInSubmenu = path.split('.').length > 2;

    // Special case: Page explorer
    if (data.name === 'explorer') {
        return <ExplorerMenuItem path={path} data={data} state={state} dispatch={dispatch} navigate={navigate} />
    }

    const onClick = (e: React.MouseEvent) => {
        e.preventDefault();

        navigate(data.url).then(() => {
            // Set active menu item
            dispatch({
                type: 'set-active-path',
                path,
            });

            // Reset navigation path to close any open submenus
            dispatch({
                type: 'set-navigation-path',
                path: '',
            });
        });
    }

    return (
        <MenuItemWrapper isActive={isActive} isInSubmenu={isInSubmenu}>
            <a href="#"
               onClick={onClick}
               className={data.classnames}>
                {data.icon_name && <Icon name={data.icon_name} className="icon--menuitem"/>}
                <span className="menuitem-label">{data.label}</span>
            </a>
        </MenuItemWrapper>
    );
}

interface MenuGroupWrapperProps extends MenuItemWrapperProps {
    isOpen: boolean;
}

const MenuGroupWrapper = styled(MenuItemWrapper)<MenuGroupWrapperProps>`
    ${(props) => props.isOpen && css`
        background: #262626;  // $nav-submenu-bg;

        > a {
            text-shadow: -1px -1px 0 rgba(0, 0, 0, 0.3);

            &:hover {
                background-color: transparent;
            }
        }
    `}
`;

interface SubmenuWrapperProps {
    // isVisible can be true while isOpen is false when the menu is closing
    isVisible: boolean;
    isOpen: boolean;
    collapsed: boolean;
}

const SubmenuWrapper = styled.div<SubmenuWrapperProps>`
    visibility: hidden;
    background: #262626;  // $nav-submenu-bg;
    z-index: -2;
    transform: translate3d(0, 0, 0);
    position: fixed;
    height: 100vh;
    width: 200px;  // $menu-width;
    padding: 0;
    top: 0;
    left: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    ${mixins.transition('left 0.3s ease')}

    h2,
    &__list {
        width: 200px;  // $menu-width;
    }

    h2 {
        display: block;
        padding: 0.2em 0;
        font-size: 1.2em;
        font-weight: 500;
        text-transform: none;
        text-align: center;
        color: #ccc;  // $color-menu-text;

        &:before {
            font-size: 4em;
            display: block;
            text-align: center;
            margin: 0 0 0.2em;
            width: 100%;
            opacity: 0.15;
        }
    }

    ul {
        overflow: auto;
        flex-grow: 1;
    }

    li {
        border: 0;
    }

    &__footer {
        margin: 0;
        text-align: center;
        color: #ccc;  // $color-menu-text;
        line-height: 50px;  // $nav-footer-closed-height;
        padding: 0;
    }

    ${(props) => props.isVisible && css`
        visibility: visible;
        box-shadow: 2px 0 2px rgba(0, 0, 0, 0.35);

        a {
            padding-left: 3.5em;
        }
    `}

    ${(props) => props.collapsed && css`
        left: -150px;  // Slim menu width minus submenu width
    `}

    ${(props) => props.isOpen && css`
        left: 200px;  // Menu width

        // If another submenu is opening, display this menu behind it
        z-index: -1;
    `}

    ${(props) => props.isOpen && props.collapsed && css`
        left: 50px;  // Slim menu width
    `}
`;

interface MenuGroupProps {
    path: string;
    data: MenuItemCommon;
    items: MenuData;
    state: MenuState;
    dispatch(action: MenuAction): void;
    collapsed: boolean;
    navigate(url: string): Promise<void>;
}

const MenuGroup: React.FunctionComponent<MenuGroupProps> = ({path, data, items, state, dispatch, collapsed, navigate}) => {
    const isOpen = state.navigationPath.startsWith(path);
    const isActive = isOpen || state.activePath.startsWith(path);
    const [isVisible, setIsVisible] = React.useState(false);

    React.useEffect(() => {
        if (isOpen) {
            // isOpen is set at the moment the user clicks the menu item
            setIsVisible(true);
        } else if (!isOpen && isVisible) {
            // When a submenu is closed, we have to wait for the close animation
            // to finish before making it invisible
            setTimeout(() => {
                setIsVisible(false);
            }, 300);
        }
    }, [isOpen]);

    const onClick = (e: React.MouseEvent) => {
        if (isOpen) {
            dispatch({
                type: 'set-navigation-path',
                path: '',
            });
        } else {
            dispatch({
                type: 'set-navigation-path',
                path,
            });
        }

        e.preventDefault();
    };

    return (
        <MenuGroupWrapper isActive={isActive} isInSubmenu={false} isOpen={isOpen}>
            <a href="#" onClick={onClick} className={data.classnames} aria-haspopup="true" aria-expanded={isOpen ? 'true' : 'false'}>
                {data.icon_name && <Icon name={data.icon_name} className="icon--menuitem"/>}
                <span className="menuitem-label">{data.label}</span>
                <SubmenuTriggerIcon name="arrow-right" isOpen={isOpen} />
            </a>
            <SubmenuWrapper isVisible={isVisible} isOpen={isOpen} collapsed={collapsed}>
                <h2 id={`nav-submenu-${data.name}-title`} className={data.classnames}>
                    {data.icon_name && <Icon name={data.icon_name} className="icon--submenu-header"/>}
                    {data.label}
                </h2>
                <ul aria-labelledby="nav-submenu-{{ name }}-title">
                    {renderMenuItems(path, items, state, dispatch, collapsed, navigate)}
                </ul>
            </SubmenuWrapper>
        </MenuGroupWrapper>
    );
}

function renderMenuItems(path: string, menuItems: MenuData, state: MenuState, dispatch: (action: MenuAction) => void, collapsed: boolean, navigate: (url: string) => Promise<void>) {
    return (
        <>
            {menuItems.map(menuItem => {
                switch (menuItem.type) {
                    case 'group':
                        return <MenuGroup key={menuItem.data.name} path={`${path}.${menuItem.data.name}`} data={menuItem.data} state={state} dispatch={dispatch} collapsed={collapsed} items={menuItem.items} navigate={navigate} />;
                    case 'item':
                        return <MenuItem key={menuItem.data.name} path={`${path}.${menuItem.data.name}`} data={menuItem.data} state={state} dispatch={dispatch} navigate={navigate} />;
                }
            })}
        </>
    )
}

interface SetActivePath {
    type: 'set-active-path',
    path: string,
}

interface SetNavigationPath {
    type: 'set-navigation-path',
    path: string,
}

type MenuAction = SetActivePath | SetNavigationPath;

interface MenuState {
    navigationPath: string;
    activePath: string;
}

function menuReducer(state: MenuState, action: MenuAction) {
    let newState = Object.assign({}, state);

    if (action.type === 'set-active-path') {
        newState.activePath = action.path;
    } else if (action.type === 'set-navigation-path') {
        newState.navigationPath = action.path;
    }

    return newState;
}

interface MainNavProps {
    collapsed: boolean;
    fullyExpanded: boolean;
    openFooter: boolean;
}

const MainNav = styled.nav<MainNavProps>`
    overflow: auto;
    margin-bottom: ${(props: MainNavProps) => props.openFooter ? '127px' /* $nav-footer-open-height */: '50px' /* $nav-footer-closed-height */};
    opacity: 1;

    ${mixins.transition('margin-bottom 0.3s ease')}

    ul,
    li {
        margin: 0;
        padding: 0;
        list-style-type: none;
    }

    li {
        ${mixins.transition('border-color 0.3s ease')}
        position: relative;
    }

    a {
        ${mixins.transition('border-color 0.3s ease')}
        -webkit-font-smoothing: auto;
        text-decoration: none;
        display: block;
        color: #ccc;  // $color-menu-text;
        padding: 0.8em 1.7em;
        font-size: 1em;
        font-weight: normal;
        // Note, font-weights lower than normal,
        // and font-size smaller than 1em (80% ~= 12.8px),
        // makes the strokes thinner than 1px on non-retina screens
        // making the text semi-transparent
        &:hover,
        &:focus {
            background-color: rgba(100, 100, 100, 0.15);  // $nav-item-hover-bg;
            color: #fff;  // $color-white
            text-shadow: -1px -1px 0 rgba(0, 0, 0, 0.3);
        }
    }

    *:focus {
        ${mixins.showFocusOutlineInside()}
    }

    .icon--menuitem {
        width: 1.25em;
        height: 1.25em;
        margin-right: 0.5em;
        vertical-align: text-top;
    }

    .icon--submenu-header {
        display: block;
        width: 4rem;
        height: 4rem;
        margin: 0 auto 0.8em;
        opacity: 0.15;
    }

    > ul > li > a {
        // Need !important to override body.ready class
        transition: padding 0.3s ease !important;

        .menuitem-label {
            transition: opacity 0.3s ease;
        }
    }

    ${(props) => props.collapsed && css`
        > ul > li > a {
            padding: 0.8em 0.8em;

            .menuitem-label {
                opacity: 0;
            }

            .icon-arrow-right {
                top: 1.0em;
                right: 0.15em;
                width: 1em;
                height:1em;
            }
        }
    `}

    ${(props) => !props.fullyExpanded && css`
        overflow-x: hidden;
    `}
`;

interface FooterWrapperProps {
    collapsed: boolean;
    isOpen: boolean;
}

const FooterWrapper = styled.li<FooterWrapperProps>`
    position: fixed !important;  // override li styling in MenuWrapper
    width: 200px;  // $menu-width;
    bottom: 0;
    background-color: #262626;  // $nav-footer-submenu-bg;
    transition: width 0.3s ease !important;  // Override body.ready

    ${(props) => (props.collapsed && !props.isOpen) && css`
        width: 50px;
    `}

    > ul {
        ${mixins.transition('max-height 0.3s ease')}

        max-height: ${(props: FooterWrapperProps) => props.isOpen ? '77px' /* $nav-footer-submenu-height */: '0'};

        a {
            border-left: 3px solid transparent;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;

            &:before {
                font-size: 1rem;
                margin-right: 0.5em;
                vertical-align: -10%;
            }
        }
    }

    .account {
        ${mixins.clearfix()}
        background: #1a1a1a;  // $nav-footer-account-bg;
        color: #ccc;  // $color-menu-text;
        text-transform: uppercase;
        display: block;
        cursor: pointer;
        position: relative;

        &:hover {
            background-color: rgba(100, 100, 100, 0.15);
            color: #fff;  // $color-white
            text-shadow: -1px -1px 0 rgba(0, 0, 0, 0.3);
        }

        .avatar {
            float: left;

            &:before {
                color: inherit;
                border-color: inherit;
            }
        }

        em {
            box-sizing: border-box;
            padding-right: 1.8em;
            margin-top: 1.2em;
            margin-left: 0.9em;
            font-style: normal;
            font-weight: 700;
            width: 135px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            position: absolute;
            left: 50px;  // Width of avatar
            transition: left 0.3s ease;

            ${(props) => (props.collapsed && !props.isOpen) && css`
                left: -150px;  // menu closed with - menu open width
            `}

            &:after {
                font-size: 1.5em;
                position: absolute;
                right: 0.25em;
            }
        }
    }
`;

interface MenuProps {
    collapsed: boolean;
    activeUrl: string;
    menuItems: MenuData;
    user: TurboProps['user'];
    accountUrl: string;
    logoutUrl: string;
    navigate(url: string): Promise<void>;
}

export const Menu: React.FunctionComponent<MenuProps> = ({collapsed, activeUrl, menuItems, user, accountUrl, logoutUrl, navigate}) => {
    const [state, dispatch] = React.useReducer(menuReducer, {
        navigationPath: '',
        activePath: '',
    });
    const accountSettingsOpen = state.navigationPath.startsWith('.account');

    // Whenever activeUrl or menuItems change, work out new activePath
    React.useEffect(() => {
        const urlToPaths: [string, string][] = [];
        const walkMenuItems = (path: string, menuItems: MenuData) => {
            menuItems.forEach((item) => {
                const newPath = `${path}.${item.data.name}`;
                if (item.type == 'group') {
                    walkMenuItems(newPath, item.items);
                } else {
                    urlToPaths.push([item.data.url, newPath]);
                }
            });
        };
        walkMenuItems('', menuItems);

        let bestMatch: [string, string] | null = null;
        urlToPaths.forEach(([url, path]) => {
            if (activeUrl.startsWith(url)) {
                if (bestMatch == null || url.length > bestMatch[0].length) {
                    bestMatch = [url, path];
                }
            }
        });

        const newActivePath = bestMatch ? bestMatch[1] : '';

        // TODO: Probably doesn't have to be in state anymore
        if (newActivePath !== state.activePath) {
            dispatch({
                type: 'set-active-path',
                path: newActivePath,
            });
        }
    }, [activeUrl, menuItems]);

    // const activeClass = 'submenu-active';
    //const submenuContainerRef = React.useRef<HTMLLIElement | null>(null);
    React.useEffect(() => {
/* TODO
        // Close submenu when user clicks outside of it
        // FIXME: Doesn't actually work because outside click events are usually in an iframe.
        const onMousedown = (e: MouseEvent) => {
            if (e.target instanceof HTMLElement && submenuContainerRef.current && !submenuContainerRef.current.contains(e.target)) {
                //dispatch({
                //    type: 'close-submenu',
                //});
            }
        };
*/

        // Close submenus when user presses escape
        const onKeydown = (e: KeyboardEvent) => {
            // IE11 uses "Esc" instead of "Escape"
            if (e.key === 'Escape' || e.key === 'Esc') {
                dispatch({
                    type: 'set-navigation-path',
                    path: ''
                });
            }
        };

        // document.addEventListener('mousedown', onMousedown);
        document.addEventListener('keydown', onKeydown);

        return () => {
            // document.removeEventListener('mousedown', onMousedown);
            document.removeEventListener('keydown', onKeydown);
        };
    }, []);

    // Whenever the menu is uncollapsed, wait until it has fully expanded before adding the `overflow: auto` rule back
    // This prevents an ugly flash of the scrollbar while the animation is in progress
    const [fullyExpanded, setFullyExpanded] = React.useState(collapsed);
    React.useEffect(() => {
        if (collapsed) {
            setFullyExpanded(false);
        }
        if (!collapsed && !fullyExpanded) {
            const timeout = setTimeout(() => {
                setFullyExpanded(true);
            }, 300);
            return () => clearTimeout(timeout);
        }
    }, [collapsed]);

    const onClickLink = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (e.target instanceof HTMLAnchorElement) {
            const href = e.target.getAttribute('href');
            if (href && href.startsWith('/')) {
                e.preventDefault();
                navigate(href);
            }

            dispatch({
                type: 'set-navigation-path',
                path: '',
            });
        }
    };

    const onClickAccountSettings = (e: React.MouseEvent) => {
        e.preventDefault();

        if (accountSettingsOpen) {
            dispatch({
                type: 'set-navigation-path',
                path: '',
            });
        } else {
            dispatch({
                type: 'set-navigation-path',
                path: '.account',
            });
        }
    }

    return (
        <MainNav collapsed={collapsed} fullyExpanded={fullyExpanded} openFooter={accountSettingsOpen}>
            <ul>
                {renderMenuItems('', menuItems, state, dispatch, collapsed, navigate)}

                <FooterWrapper collapsed={collapsed} isOpen={accountSettingsOpen}>
                    <div className="account" title={gettext('Edit your account')} onClick={onClickAccountSettings}>
                        <span className="avatar square avatar-on-dark">
                            <img src={user.avatarUrl} alt="" />
                        </span>
                        <em className={'icon ' + (accountSettingsOpen ? 'icon-arrow-down-after' : 'icon-arrow-up-after')}>{user.name}</em>
                    </div>

                    <ul>
                        <li><a href={accountUrl} onClick={onClickLink} className="icon icon-user">{gettext('Account settings')}</a></li>
                        <li><a href={logoutUrl} onClick={onClickLink} className="icon icon-logout">{gettext('Log out')}</a></li>
                    </ul>
                </FooterWrapper>
            </ul>
        </MainNav>
    );
}
