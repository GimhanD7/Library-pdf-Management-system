import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            <div className="flex min-h-screen flex-col items-center bg-[#FDFDFC] p-6 text-[#1b1b18] lg:justify-center lg:p-8 dark:bg-[#0a0a0a]">
                <header className="w-full max-w-6xl mx-auto mb-8 lg:mb-12">
                    <nav className="flex items-center justify-between py-4 px-6 bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-lg dark:bg-gray-900/80 dark:border-gray-700/50">
                        {/* Logo/Brand */}
                        <div className="flex items-center">
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                </div>
                                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Library
                                </span>
                            </div>
                        </div>

                        {/* Navigation Links */}
                        <div className="flex items-center space-x-3">
                            {auth.user ? (
                                <div className="flex items-center space-x-3">
                                    <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
                                        Welcome back!
                                    </span>
                                    <Link
                                        href={route('dashboard')}
                                        className="inline-flex items-center px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                        </svg>
                                        Dashboard
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-transparent hover:bg-gray-100 rounded-full transition-all duration-200 dark:text-gray-300 dark:hover:bg-gray-800"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="inline-flex items-center px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                        </svg>
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>
                    </nav>
                </header>
              
                {/* Hero Section */}
                <main className="flex flex-col items-center justify-center flex-1 w-full px-4 sm:px-6 lg:px-8">
                    {/* Hero Content */}
                    <div className="w-full max-w-7xl mx-auto">
                        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-[#1b1b18] dark:text-[#EDEDEC] leading-tight">
                                Welcome to{' '}
                                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Library
                                </span>
                            </h1>
                            <p className="mt-4 sm:mt-6 text-base sm:text-lg lg:text-xl leading-6 sm:leading-8 text-gray-600 max-w-xs sm:max-w-2xl lg:max-w-3xl mx-auto dark:text-gray-300 px-4 sm:px-0">
                                Discover, organize, and manage your digital library with ease. 
                                A modern platform designed for knowledge enthusiasts and researchers.
                            </p>
                        </div>

                        {/* Features Section */}
                        <div className="w-full">
                            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
                                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1b1b18] mb-3 sm:mb-4 dark:text-[#EDEDEC]">
                                    Powerful Features
                                </h2>
                                <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 max-w-xs sm:max-w-2xl lg:max-w-3xl mx-auto px-4 sm:px-0">
                                    Everything you need to manage your digital library efficiently
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto">
                                {/* Organize Collections Card */}
                                {/* <div className="group relative p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-white to-blue-50/50 rounded-xl sm:rounded-2xl border border-gray-200/60 hover:border-blue-200 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 dark:from-gray-800 dark:to-blue-900/20 dark:border-gray-700/60 dark:hover:border-blue-700/50 sm:col-span-1 lg:col-span-1">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="relative">
                                        <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                                            <svg className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg sm:text-xl lg:text-xl font-bold text-[#1b1b18] mb-2 sm:mb-3 group-hover:text-blue-600 transition-colors duration-300 dark:text-[#EDEDEC] dark:group-hover:text-blue-400">
                                            Organize Collections
                                        </h3>
                                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                                            Create and manage your digital collections with powerful organizational tools and intuitive categorization.
                                        </p>
                                        <div className="mt-3 sm:mt-4 flex items-center text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                            <span className="text-xs sm:text-sm font-medium">Learn more</span>
                                            <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div> */}

                                {/* Smart Search Card */}
                                {/* <div className="group relative p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-white to-purple-50/50 rounded-xl sm:rounded-2xl border border-gray-200/60 hover:border-purple-200 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 dark:from-gray-800 dark:to-purple-900/20 dark:border-gray-700/60 dark:hover:border-purple-700/50 sm:col-span-1 lg:col-span-1">
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-pink-600/5 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="relative">
                                        <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                                            <svg className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg sm:text-xl lg:text-xl font-bold text-[#1b1b18] mb-2 sm:mb-3 group-hover:text-purple-600 transition-colors duration-300 dark:text-[#EDEDEC] dark:group-hover:text-purple-400">
                                            Smart Search
                                        </h3>
                                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                                            Find exactly what you need with our intelligent search and advanced filtering system powered by AI.
                                        </p>
                                        <div className="mt-3 sm:mt-4 flex items-center text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                            <span className="text-xs sm:text-sm font-medium">Learn more</span>
                                            <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div> */}

                                {/* Collaborate Card */}
                                {/* <div className="group relative p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-white to-emerald-50/50 rounded-xl sm:rounded-2xl border border-gray-200/60 hover:border-emerald-200 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 dark:from-gray-800 dark:to-emerald-900/20 dark:border-gray-700/60 dark:hover:border-emerald-700/50 sm:col-span-2 lg:col-span-1">
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 to-green-600/5 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="relative">
                                        <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                                            <svg className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg sm:text-xl lg:text-xl font-bold text-[#1b1b18] mb-2 sm:mb-3 group-hover:text-emerald-600 transition-colors duration-300 dark:text-[#EDEDEC] dark:group-hover:text-emerald-400">
                                            Collaborate
                                        </h3>
                                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                                            Share and collaborate on your collections with team members, friends, and the community seamlessly.
                                        </p>
                                        <div className="mt-3 sm:mt-4 flex items-center text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                            <span className="text-xs sm:text-sm font-medium">Learn more</span>
                                            <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div> */}
                            </div>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="mt-16 w-full max-w-6xl mx-auto text-center text-sm text-gray-500 dark:text-gray-400">
                    <p>&copy; 2025 Library. Built with Lakehouse IT Dept.</p>
                </footer>
            </div>
        </>
    );
}
