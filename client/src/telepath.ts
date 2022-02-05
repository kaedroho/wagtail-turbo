/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */

import Telepath from "telepath-unpack";

import { LinkMenuItemDefinition } from "./sidebar/menu/LinkMenuItem";
import { PageExplorerMenuItemDefinition } from "./sidebar/menu/PageExplorerMenuItem";
import { SubMenuItemDefinition } from "./sidebar/menu/SubMenuItem";
import { MainMenuModuleDefinition } from "./sidebar/modules/MainMenu";
import { SearchModuleDefinition } from "./sidebar/modules/Search";
import { WagtailBrandingModuleDefinition } from "./sidebar/modules/WagtailBranding";


const telepath = new Telepath();

telepath.register(
'wagtail.sidebar.LinkMenuItem',
LinkMenuItemDefinition,
);
telepath.register('wagtail.sidebar.SubMenuItem', SubMenuItemDefinition);
telepath.register(
'wagtail.sidebar.PageExplorerMenuItem',
PageExplorerMenuItemDefinition,
);

telepath.register(
'wagtail.sidebar.WagtailBrandingModule',
WagtailBrandingModuleDefinition,
);
telepath.register(
'wagtail.sidebar.SearchModule',
SearchModuleDefinition,
);
telepath.register(
'wagtail.sidebar.MainMenuModule',
MainMenuModuleDefinition,
);


export default telepath;
