# Aelphera

Aelphera is a brand-new, original re-implementation inspired by the classic online life-simulation MMO concept. We are building an open-source, server-authoritative multi-user simulation that utilizes both 2D and 3D game play interfaces as well as with a custom cross-platform client, launcher, website-login dashboard-capabilities and content pipeline.

Important Disclaimer: This project is primarily based on the Rhys Simpson riperiperiâ€™s FreeSO and Jeremy Glazebrook JDrocks450â€™s nio2so/niotso projects. Aelphera is in no way affiliated with Electronic Arts or any of the EA adversaries. All content featured is licensed appropriately.

Aelphera uses MPL-2.0 license.

Core goals (v0.1)
- Server-authoritative architecture for game state.
- Cross-platform desktop client (Windows, macOS, Linux) using MonoGame + .NET.
- Launcher (Electron) with account management, toggling of 3D gameplay, window opening into the city server environment ensuring successful gameplay and regular updates and patching.
- One playable city map divided into neighborhoods compiled with hundreds of individual lots that may be purchased by players who are entering the client server wanting to host their own room or visit the room of a friend or neighbor. Upon the purchase of the lot, the buyer avatar is now able to access a buy mode that includes many different categories of objects belonging to an almost endless catalog of items to interact with in live mode and they now have permissions to create from the build mode portion of the server which is also a seemingly never-ending catalog of tools, walls, floors, trees, flowers, streams, waters, pools, the list goes on and on for the player now host to choose from. Players host visitors and can invite others to join as roommates to the lot granting host decided ownership.
- Stable lot hosting with up to 29 players per property(lot).
- Open development and community-friendly contribution workflow.

Suggested tech stack
- Server: .NET 8, ASP.NET Core for HTTP / admin APIs
- Real-time: TCP + reliable UDP (ENet or similar)
- Client: MonoGame + .NET (Windows, macOS, Linux)
- Launcher: Electron
- Website: Next.js (React)
- DB: PostgreSQL + Redis
- CI/CD: GitHub Actions
- Asset hosting: S3-compatible + CDN

Roadmap (short)
1. Repo skeleton and docs
2. Server skeleton: auth, persistent players, basic tick loop
3. Client skeleton: connect + chat + avatar
4. Big city map with interlacing neighborhoods comprised of hundreds and hundreds of purchasable lots(rooms) for players to host in. Everchanging map that eventually will, with time, sustain road structure, terraforming, islands, icecaps, volcanos, rock, grass, snow, sand, volcanic, and seashell terrains. Completely interactive. 
5. Launcher + website + deployment

Contributing
See CONTRIBUTING.md for how to set up dev environment, coding conventions, and how to file issues / PRs.

Legal / IP
- Assets used are created and developed by the leaders of the Aelphera project and are licensed accordingly ensuring third-party dependencies are compatible with the chosen license.

Contact
Project leaders: @Jesivis and Copilot Astra (@copilot)
