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
	{
		title: "Quick Access",
		links: [
			{
				name: "Create an Account",
				href: "/auth/register",
				authHandler: (isAuth) => !isAuth,
			},
			{
				name: "Login",
				href: "/auth/login",
				authHandler: (isAuth) => !isAuth,
			},
			{
				name: "Profile",
				href: "/profile",
				authHandler: (isAuth) => isAuth,
			},
			{
				name: "Logout",
				href: "/auth/logout",
				authHandler: (isAuth) => isAuth,
			},
		],
	},
	{
		title: "PES DAY",
		links: [
			{
				name: "About PES day",
				href: "/events/pesday",
			},
			{
				name: "PES DAY'26 Registration",
				href: "/events/pesday",
			},
		],
	},
	// {
	// 	title: "Competitions",
	// 	links: [
	// 		{
	// 			name: "Semaphore",
	// 			href: "/events/mutex/semaphore",
	// 		},
	// 		{
	// 			name: "Deadloock CTF",
	// 			href: "/events/mutex/deadlock",
	// 		},
	// 		{
	// 			name: "Formula Firefighting",
	// 			href: "/events/mutex/fire-fighting",
	// 		},
	// 		{
	// 			name: "ECO-Entrepreneurship",
	// 			href: "/events/mutex/eco-e",
	// 		},
	// 	],
	// },
];
