import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <img src="https://sri-lanka.mom-gmr.org/uploads/_processed_/a/2/csm_13550-1360_company_import_2737e32a9e.png" className="size-9 fill-current text-white dark:text-black" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">Lakehouse Library</span>
            </div>
        </>
    );
}
