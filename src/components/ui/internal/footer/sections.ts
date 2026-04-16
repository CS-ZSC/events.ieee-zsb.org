interface Section {
	title: string;
	links: SectionContentLink[];
}

// interface SectionContent {
// }

interface SectionContentLink {
	name: string;
	href: string;
	authHandler?: (isAuth: boolean) => boolean;
}

export const sections: Section[] = [
	// {
	// 	title: "Quick Access",
	// 	links: [
	// 		{
	// 			name: "Create an Account",
	// 			href: "/auth/register",
	// 			authHandler: (isAuth) => !isAuth,
	// 		},
	// 		{
	// 			name: "Login",
	// 			href: "/auth/login",
	// 			authHandler: (isAuth) => !isAuth,
	// 		},
	// 		{
	// 			name: "Profile",
	// 			href: "/account",
	// 			authHandler: (isAuth) => isAuth,
	// 		},
	// 		{
	// 			name: "Settings",
	// 			href: "/account/settings",
	// 			authHandler: (isAuth) => isAuth,
	// 		},
	// 		{
	// 			name: "Logout",
	// 			href: "/auth/logout",
	// 			authHandler: (isAuth) => isAuth,
	// 		},
	// 	],
	// },
	{
		title: "MUTEX",
		links: [
			{
				name: "About Mutex",
				href: "/events/mutex",
			},
			{
				name: "Mutex Summit'25 Registration",
				href: "https://bit.ly/MUTEX_SUMMIT_25",
			},
		],
	},
	{
		title: "Competitions",
		links: [
			{
				name: "Programming Competition",
				href: "/events/mutex/competitions/3",
			},
			{
				name: "Fire Fighting Competition",
				href: "/events/mutex/competitions/4",
			},
		],
	},
];
