-- ─── YUP News — Seed Data ─────────────────────────────────────────────────────
-- Run this in your Supabase SQL editor to populate the database with sample posts.
-- Images use picsum.photos with consistent seeds for deterministic results.

INSERT INTO posts (title, slug, excerpt, cover_image, category, region, tags, source_name, views, status, is_auto_generated, published_at, content) VALUES

-- ─── United States ─────────────────────────────────────────────────────────────

(
  'Federal Reserve Holds Rates Steady Amid Cooling Inflation Signals',
  'federal-reserve-holds-rates-steady-2026',
  'The central bank opted to maintain its benchmark interest rate at 5.25–5.5%, citing encouraging progress on inflation but warning that premature cuts could reignite price pressures.',
  'https://picsum.photos/seed/federal-reserve/800/450',
  'business',
  'us',
  ARRAY['economy', 'federal reserve', 'interest rates', 'inflation'],
  'YUP Business Desk',
  842,
  'published',
  false,
  NOW() - INTERVAL '2 hours',
  '<p>The Federal Reserve held its benchmark interest rate steady at 5.25–5.5% on Wednesday, as policymakers signaled cautious optimism about the trajectory of inflation without committing to a near-term pivot.</p>

<h2>Why the Fed Held</h2>

<p>Chair Jerome Powell told reporters at a post-meeting press conference that while recent data showing cooling price pressures was "encouraging," officials needed "greater confidence" that inflation was durably moving toward the 2% target before easing monetary policy.</p>

<p>"We are committed to our 2% inflation goal," Powell said. "We believe that our policy rate is likely at its peak for this tightening cycle, and that if the economy evolves broadly as expected, it will likely be appropriate to begin dialing back policy restraint at some point this year."</p>

<h2>Market Reaction</h2>

<p>Equity markets initially dipped on the statement before recovering as traders parsed Powell''s language as broadly consistent with their expectations for rate cuts beginning mid-year. The S&P 500 ended the session up 0.4%, while the yield on the 10-year Treasury note fell to 4.31%.</p>

<p>Fed funds futures markets are currently pricing in roughly three quarter-point rate cuts over the course of the year, with the first fully priced for June.</p>

<h2>The Inflation Picture</h2>

<p>The Consumer Price Index rose 3.1% in January year-over-year, down from its peak of more than 9% in June 2022 but still above the Fed''s stated target. Core inflation, which strips out volatile food and energy prices, came in at 3.9%.</p>

<p>Several Fed officials have pointed to stubborn services inflation — particularly in shelter — as a reason for patience. Housing costs, which account for roughly a third of the CPI basket, have remained elevated even as market rents have moderated.</p>

<blockquote>The last mile of disinflation is always the hardest. We intend to be patient and data-dependent.</blockquote>

<p>The next scheduled Fed meeting is in March, with updated economic projections and a new "dot plot" — the Fed''s summary of individual policymakers'' rate expectations — set to be released alongside the decision.</p>'
),

(
  'Senate Passes Sweeping AI Regulation Bill in Bipartisan Vote',
  'senate-passes-ai-regulation-bill-2026',
  'The landmark legislation would require companies deploying large AI models to register with a new federal agency and submit to mandatory safety evaluations before public release.',
  'https://picsum.photos/seed/senate-ai-bill/800/450',
  'technology',
  'us',
  ARRAY['artificial intelligence', 'regulation', 'senate', 'congress', 'tech policy'],
  'YUP Politics Desk',
  1204,
  'published',
  false,
  NOW() - INTERVAL '5 hours',
  '<p>The United States Senate passed the Responsible AI Development Act on Thursday in a 67–31 bipartisan vote, marking the most significant federal regulation of artificial intelligence to date and sending the bill to the House where its prospects remain uncertain.</p>

<h2>What the Bill Does</h2>

<p>The legislation would establish a new National AI Safety Board with authority to review large AI systems before deployment, mandate incident reporting when AI causes material harm, and require "red team" adversarial testing for models above a certain capability threshold.</p>

<p>It also includes provisions requiring AI-generated content to be labeled and prohibiting the use of AI in certain high-stakes decisions — including parole determinations and child welfare assessments — without human review.</p>

<h2>Industry Response</h2>

<p>The bill has divided the technology industry. Several major AI labs, including Anthropic and OpenAI, have publicly supported some version of mandatory safety evaluations, arguing that regulatory clarity would help distinguish responsible developers from bad actors.</p>

<p>Others, including a coalition of smaller startups, warned that compliance costs could entrench incumbents and stifle innovation. The Chamber of Commerce opposed the bill''s pre-deployment review requirements as "unworkable" given the pace of AI development.</p>

<h2>Path to the House</h2>

<p>House Speaker Mike Johnson has not committed to bringing the bill to the floor, and several influential members of the House Energy and Commerce Committee have said they want significant modifications before passage.</p>

<p>The White House issued a statement praising the Senate''s action while stopping short of a veto pledge on the House version, leaving the door open for negotiation.</p>'
),

(
  'Texas Drought Deepens as Reservoir Levels Hit 30-Year Low',
  'texas-drought-reservoirs-30-year-low',
  'Weeks without meaningful rainfall have pushed water storage in Texas''s major reservoirs to their lowest point since the 1996 drought, with officials warning of mandatory restrictions.',
  'https://picsum.photos/seed/texas-drought/800/450',
  'health',
  'us',
  ARRAY['drought', 'climate', 'water', 'texas', 'environment'],
  'YUP Environment Desk',
  567,
  'published',
  false,
  NOW() - INTERVAL '8 hours',
  '<p>Texas is entering a severe drought emergency as reservoir levels across the state have fallen to their lowest levels in three decades, prompting water utility managers and state officials to begin planning for mandatory conservation measures.</p>

<h2>The Scale of the Crisis</h2>

<p>Lake Travis, the primary drinking water reservoir for the Austin metropolitan area, is currently at just 38% capacity. Lake Texoma, which serves parts of North Texas and southern Oklahoma, has dropped to 31%. Statewide, the average reservoir level is 52%, compared to the 10-year average of 71% for this time of year.</p>

<p>The Texas Water Development Board said Wednesday that if conditions do not improve within the next 60 days, more than 40 municipalities could face Drought Stage 3 or higher restrictions, which include prohibitions on outdoor watering and car washing.</p>

<h2>Agricultural Impact</h2>

<p>The drought is already causing significant damage to the state''s $130 billion agricultural sector. Winter wheat crops across the Panhandle have failed at rates not seen since 2011, when a historic drought cost the state''s farmers an estimated $7.6 billion.</p>

<blockquote>We''re telling our members to prepare for the possibility that there may be no winter wheat harvest at all this year in some counties.</blockquote>

<p>Cattle ranchers have begun selling off herds earlier than planned as pasture conditions deteriorate and the cost of supplemental feed rises. The Texas and Southwestern Cattle Raisers Association estimates the drought has already cost the beef industry more than $1.2 billion this year.</p>

<h2>Long-Range Forecast</h2>

<p>The National Oceanic and Atmospheric Administration''s long-range forecast shows a 60% probability of below-normal precipitation across most of Texas through May, offering little relief in the near term. Climate scientists point to elevated sea surface temperatures in the Gulf of Mexico, which have disrupted typical rainfall patterns.</p>'
),

(
  'Chicago Schools Strike Enters Third Week With No Deal in Sight',
  'chicago-schools-strike-third-week',
  'More than 300,000 students remain out of class as negotiations between the Chicago Teachers Union and city officials stall over pay, class sizes, and staffing levels.',
  'https://picsum.photos/seed/chicago-teachers/800/450',
  'politics',
  'us',
  ARRAY['education', 'strike', 'chicago', 'teachers union', 'labor'],
  'YUP Education Desk',
  389,
  'published',
  false,
  NOW() - INTERVAL '1 day',
  '<p>Negotiations between the Chicago Teachers Union and city officials showed little progress on Friday as the strike entered its third week, leaving more than 300,000 students without in-person instruction and amplifying pressure on Mayor Brandon Johnson — himself a former CTU organizer — to broker a deal.</p>

<h2>The Core Disputes</h2>

<p>The union is seeking an 8% annual pay increase over a four-year contract, citing a cost-of-living squeeze that has pushed many teachers to take on second jobs or leave the city entirely. The city has offered 5.5% per year, arguing that a higher settlement would blow a hole in an already-strained municipal budget.</p>

<p>Beyond pay, the CTU is demanding caps on class sizes, hiring of additional counselors and social workers, and an end to what union leaders call "school closures by attrition" — a practice of reducing enrollment in struggling schools until closure becomes inevitable.</p>

<h2>Political Pressure</h2>

<p>Mayor Johnson''s political allies in the progressive wing of the Democratic Party have grown increasingly uncomfortable with the standoff, given his history as a CTU organizer and his campaign pledges to be the most labor-friendly mayor in Chicago history.</p>

<p>Aldermanic allies have privately urged the mayor''s office to find a compromise, warning that a prolonged strike risks damaging his political coalition ahead of the 2027 election.</p>

<blockquote>Every day this drags on, families are suffering. We need leadership that matches the moment.</blockquote>

<p>Parents across the city have organized impromptu childcare networks and learning pods, but community leaders warn that low-income families — who lack the resources to arrange alternatives — are bearing the greatest burden.</p>'
),

(
  'NFL Draft: Five Quarterbacks Expected to Go in First Round',
  'nfl-draft-five-quarterbacks-first-round-2026',
  'This year''s class features an unprecedented depth of starting-caliber quarterbacks, with analysts projecting the most QBs taken in the top 32 picks since the 2021 draft.',
  'https://picsum.photos/seed/nfl-draft-qb/800/450',
  'sports',
  'us',
  ARRAY['nfl', 'draft', 'quarterback', 'football', 'sports'],
  'YUP Sports Desk',
  2103,
  'published',
  false,
  NOW() - INTERVAL '2 days',
  '<p>With the NFL Draft less than two months away, mock drafters and front-office analysts are converging on a consensus: this year''s quarterback class is historically deep, with five players widely considered capable of becoming franchise cornerstones.</p>

<h2>The Top Prospects</h2>

<p>Caleb Strickland of Ohio State leads most big boards, a 6-foot-5 pocket passer who shredded Big Ten defenses with a 74% completion rate and 38 touchdowns. He''s widely expected to go first overall to the Tennessee Titans, who hold the top pick after finishing 4–13.</p>

<p>Behind him, Marcus Webb from Alabama and Jordan Castillo from Georgia are considered near-locks for the top 10. Webb''s athleticism — he ran a 4.48 40-yard dash at the combine — gives him a dual-threat profile that projects well in modern offenses. Castillo, meanwhile, posted one of the most efficient college careers on record.</p>

<h2>Teams in the Market</h2>

<p>Multiple teams beyond the Titans are looking to upgrade at the position. The New England Patriots, holding the third pick, are widely expected to select a quarterback for the first time since drafting Mac Jones in 2021. The Carolina Panthers, Jets, and Raiders have all been linked to trade-ups in various reports.</p>

<blockquote>You don''t pass on a franchise quarterback if you need one. You figure out the rest later.</blockquote>

<p>The remaining two quarterbacks in the projected top-32 group — Tyler Ramos of Clemson and Deshawn Parks of Michigan — offer intriguing upside but come with more questions about their readiness to start immediately.</p>'
),

-- ─── Nigeria ───────────────────────────────────────────────────────────────────

(
  'Dangote Refinery Reaches Full Capacity, Ending Nigeria''s Petrol Import Era',
  'dangote-refinery-full-capacity-2026',
  'Africa''s largest oil refinery has ramped to its nameplate capacity of 650,000 barrels per day, a milestone that analysts say will fundamentally reshape fuel pricing across West Africa.',
  'https://picsum.photos/seed/dangote-refinery/800/450',
  'business',
  'africa',
  ARRAY['dangote', 'refinery', 'oil', 'africa', 'energy', 'economy'],
  'YUP Business Desk',
  3421,
  'published',
  false,
  NOW() - INTERVAL '3 hours',
  '<p>The Dangote Petroleum Refinery in Lagos has reached its full nameplate capacity of 650,000 barrels per day, a milestone that Aliko Dangote described as "the most important industrial achievement in Africa in a generation" and one that is already beginning to reduce Nigeria''s longstanding dependence on imported petroleum products.</p>

<h2>What Full Capacity Means</h2>

<p>The refinery, which began partial operations in late 2023 after years of delays, is now producing enough petrol, diesel, kerosene, and aviation fuel to supply Nigeria''s entire domestic demand and export significant volumes to neighboring countries.</p>

<p>Nigeria had for decades been the world''s most anomalous major oil producer — pumping millions of barrels of crude daily while importing virtually all of its refined petroleum products, a situation that cost the country tens of billions of dollars in foreign exchange annually and made it uniquely vulnerable to global supply disruptions.</p>

<h2>Petrol Prices</h2>

<p>Retail petrol prices in Lagos have fallen by nearly 30% over the past three months as domestically refined fuel enters the market, though economists caution that the full benefit to consumers will take time to materialize given existing distribution infrastructure gaps.</p>

<blockquote>This is not just a business story. This is a sovereignty story. Nigeria no longer needs to beg the world for its own fuel.</blockquote>

<h2>Regional Impact</h2>

<p>West African countries including Ghana, Senegal, and Ivory Coast — which currently import most of their refined petroleum products from Europe — are expected to increasingly source supply from the Dangote facility. Several West African governments have signed preliminary offtake agreements.</p>

<p>The International Energy Agency said the refinery''s full ramp represents a structural shift in regional energy markets that will take years to fully play out.</p>'
),

(
  'Nigeria''s Inflation Falls to 22% as New Monetary Policy Gains Traction',
  'nigeria-inflation-falls-22-percent',
  'The latest data from the National Bureau of Statistics shows headline inflation declining for the fourth consecutive month, boosting confidence in the Central Bank''s tightening campaign.',
  'https://picsum.photos/seed/nigeria-inflation/800/450',
  'business',
  'africa',
  ARRAY['inflation', 'economy', 'africa', 'central bank', 'naira'],
  'YUP Business Desk',
  1876,
  'published',
  false,
  NOW() - INTERVAL '6 hours',
  '<p>Nigeria''s headline inflation rate fell to 22.1% in January, down from 24.5% in October and the fourth consecutive monthly decline, the National Bureau of Statistics reported on Wednesday — a development that analysts attributed primarily to the Central Bank of Nigeria''s aggressive interest rate tightening and a relative stabilization of the naira.</p>

<h2>The Trend</h2>

<p>The steady decline from a peak of 28.9% in August represents a meaningful improvement, though inflation remains well above the CBN''s long-run target band of 6–9% and continues to erode purchasing power for ordinary Nigerians.</p>

<p>Food inflation, which carries the heaviest weight in the Nigerian CPI basket, slowed to 26.8% from 30.1% in October, reflecting improved harvest conditions following a better-than-expected dry season and the government''s border liberalization of key agricultural commodities.</p>

<h2>Currency Stability</h2>

<p>The naira has traded in a relatively narrow band against the dollar on both the official and parallel markets since the CBN moved to unify its exchange rate windows and raised its key monetary policy rate to 27.5% — the highest level in more than two decades.</p>

<blockquote>The medicine is working, though the patient is still not well. We expect to remain in data-dependent tightening mode.</blockquote>

<h2>Growth Concerns</h2>

<p>The tighter monetary policy has come at a cost to economic activity. Manufacturing PMI fell to its lowest point in four years in January, and several major employers have announced hiring freezes or workforce reductions. The World Bank revised its Nigeria GDP growth forecast down to 2.8% for 2026, citing the impact of high borrowing costs on investment.</p>'
),

(
  'Lagos-Abuja High-Speed Rail Breaks Ground After Decade of Planning',
  'lagos-abuja-high-speed-rail-groundbreaking',
  'The $15 billion infrastructure project, co-financed by a consortium of African development banks and Chinese lenders, is projected to cut travel time between Nigeria''s two largest cities from 12 hours to under 4.',
  'https://picsum.photos/seed/lagos-abuja-rail/800/450',
  'business',
  'africa',
  ARRAY['infrastructure', 'railway', 'africa', 'lagos', 'abuja', 'development'],
  'YUP Infrastructure Desk',
  2890,
  'published',
  false,
  NOW() - INTERVAL '1 day',
  '<p>Nigeria broke ground on the Lagos–Abuja High-Speed Rail corridor on Thursday in a ceremony attended by President Bola Tinubu, marking the formal start of what promises to be the most ambitious infrastructure project in the country''s history.</p>

<h2>The Project</h2>

<p>The 756-kilometer rail line will connect Lagos, Nigeria''s commercial capital and most populous city, with Abuja, the federal capital, via intermediate stops at Ibadan, Ilorin, and Kaduna. At its design speed of 250 kilometers per hour, the journey that currently takes 12 or more hours by road — or an expensive domestic flight — will take approximately three hours and 45 minutes.</p>

<p>The project is being developed under a public-private partnership framework with a consortium that includes the African Development Bank, the Africa Finance Corporation, and Sinohydro, a unit of Chinese state enterprise Power Construction Corporation of China.</p>

<h2>Economic Rationale</h2>

<p>The Lagos-Abuja corridor is one of the busiest intercity travel routes in Africa, with an estimated 15 million passenger trips annually. Economists project that reliable high-speed connectivity between the two cities could add between 0.3 and 0.6 percentage points to Nigeria''s annual GDP growth by reducing logistics costs and integrating labor markets.</p>

<blockquote>This railway is not about moving people. It is about moving the Nigerian economy into the 21st century.</blockquote>

<h2>Timeline and Risks</h2>

<p>The project is scheduled for completion in 2031, though infrastructure analysts note that the track record of large Nigerian infrastructure projects suggests the timeline may slip. Land acquisition in the Lagos and Ibadan corridors remains a source of potential legal disputes.</p>'
),

(
  'Super Eagles Qualify for 2027 AFCON After Thrilling Draw in Ghana',
  'nigeria-super-eagles-afcon-2027-qualification',
  'A 1-1 draw in Accra was enough for Nigeria to seal automatic qualification for the Africa Cup of Nations with two group games to spare, ending months of anxiety for the coaching staff.',
  'https://picsum.photos/seed/super-eagles-afcon/800/450',
  'sports',
  'africa',
  ARRAY['super eagles', 'afcon', 'africa', 'football', 'africa cup of nations'],
  'YUP Sports Desk',
  4521,
  'published',
  false,
  NOW() - INTERVAL '3 days',
  '<p>Nigeria''s Super Eagles secured automatic qualification for the 2027 Africa Cup of Nations on Tuesday night with a hard-fought 1-1 draw against Ghana in Accra, a result that was enough to confirm top spot in Group F with two qualifying matches remaining.</p>

<h2>The Match</h2>

<p>Ghana struck first through a Jordan Ayew penalty in the 34th minute after a handball decision that Nigeria''s players protested vigorously. The Eagles responded with an equalizer from striker Terem Moffi just before halftime — his eighth qualifying goal — and both sides had chances to win in a tense second period.</p>

<p>Goalkeeper Stanley Nwabali produced a magnificent late save to deny Thomas Partey, a stop that the Nigerian camp celebrated as much as the goal that preceded it.</p>

<h2>Qualifying Table</h2>

<p>Nigeria leads Group F with 13 points from six games, four ahead of Ghana in second place. The top two from each group advance automatically to the tournament, which will be hosted jointly by Senegal and The Gambia.</p>

<blockquote>We knew what we needed. The boys showed character and that is what it takes at international level.</blockquote>

<h2>Tournament Expectations</h2>

<p>Nigeria has reached the final of the last three AFCON tournaments, winning in 2023 and finishing as runner-up in 2025. The coaching staff has pointed to the depth of the current squad — which features several Premier League and Serie A starters — as a reason for confidence ahead of the 2027 edition.</p>'
),

(
  'Kano State Launches Free Primary Healthcare for All Residents Under 18',
  'kano-free-healthcare-under-18',
  'The scheme, funded through a combination of state oil revenues and a World Bank health systems grant, will provide free consultations, basic medications, and emergency care at all public facilities.',
  'https://picsum.photos/seed/kano-healthcare/800/450',
  'health',
  'africa',
  ARRAY['healthcare', 'kano', 'africa', 'public health', 'children'],
  'YUP Nigeria Desk',
  987,
  'published',
  false,
  NOW() - INTERVAL '4 days',
  '<p>Kano State has launched a universal free primary healthcare program for all residents under the age of 18, Governor Abba Kabir Yusuf announced Wednesday, in what health advocates described as the most comprehensive child health initiative undertaken by a Nigerian state government.</p>

<h2>What the Scheme Covers</h2>

<p>Beginning immediately, children under 18 will receive free outpatient consultations, basic laboratory tests, essential medications from a defined formulary, and emergency care at all 485 public primary health centers and 18 general hospitals across the state. The program does not cover tertiary hospital care or elective procedures.</p>

<p>A complementary community health worker deployment — 2,400 new positions funded through the World Bank grant — will focus on preventive care, vaccination coverage, and maternal health education in rural local government areas where health outcomes have historically been weakest.</p>

<h2>Funding</h2>

<p>The program is projected to cost ₦28 billion in its first year, funded through a combination of a dedicated share of Kano''s statutory oil revenue allocation, a $180 million World Bank Health Systems Strengthening Grant, and a health levy on businesses operating within the state.</p>

<blockquote>No child in Kano should die from a condition that costs less than five hundred naira to treat. That era is over.</blockquote>

<h2>Regional Significance</h2>

<p>Kano is Nigeria''s second most populous state with an estimated 18 million residents. If the program delivers measurable improvements in child health indicators — particularly the state''s under-5 mortality rate, which currently stands at 120 per 1,000 live births against a national average of 100 — it could become a model for other states.</p>'
),

-- ─── Global / World ────────────────────────────────────────────────────────────

(
  'COP31 Opens in Nairobi With Calls for Tripling Renewable Capacity',
  'cop31-nairobi-renewable-energy',
  'World leaders gathered in Kenya for the 31st UN climate summit have pledged to accelerate the clean energy transition, though critics say financing commitments fall well short of what is needed.',
  'https://picsum.photos/seed/cop31-nairobi/800/450',
  'health',
  'global',
  ARRAY['climate', 'cop31', 'nairobi', 'renewable energy', 'environment', 'global'],
  'YUP World Desk',
  1543,
  'published',
  false,
  NOW() - INTERVAL '1 day',
  '<p>The 31st Conference of the Parties to the UN Framework Convention on Climate Change opened in Nairobi on Monday with high-profile commitments to accelerate the global clean energy transition, even as developing nations pressed wealthy countries to make good on longstanding financing pledges that remain largely unfulfilled.</p>

<h2>The Nairobi Targets</h2>

<p>A joint declaration signed by 94 countries at the opening session committed signatories to tripling global renewable energy capacity by 2030 from 2022 levels and doubling the annual rate of energy efficiency improvements. The targets are broadly consistent with what the International Energy Agency says is necessary to limit global warming to 1.5°C.</p>

<p>A separate finance commitment — the centerpiece of the wealthy nations'' agenda — pledged $500 billion annually for climate adaptation and mitigation in developing countries through 2035. The figure, while nominally large, is less than half what the Independent High-Level Expert Group on Climate Finance said last year was needed.</p>

<h2>The Developing World''s Grievances</h2>

<p>Representatives from the African Union, the Alliance of Small Island States, and the Least Developed Countries group used the opening plenary to press high-income nations on the unfulfilled $100 billion per year commitment made at COP15 in 2009 — a pledge that was not met until 2023, thirteen years late.</p>

<blockquote>We are being asked to bear the cost of a crisis we did not create. That is not partnership. That is extraction.</blockquote>

<p>The summit will run through March 7th, with negotiators expecting a final agreement on a new global carbon trading framework and binding adaptation finance targets to be the hardest-fought issues.</p>'
),

(
  'China''s Economy Grows 4.6% in 2025, Falling Short of Government Target',
  'china-economy-gdp-2025-miss',
  'Official figures show the world''s second-largest economy grew below its 5% goal for the first time since the pandemic, as a prolonged property sector downturn and weak consumer demand weighed on activity.',
  'https://picsum.photos/seed/china-gdp-2025/800/450',
  'business',
  'global',
  ARRAY['china', 'economy', 'gdp', 'growth', 'property market'],
  'YUP World Desk',
  2134,
  'published',
  false,
  NOW() - INTERVAL '2 days',
  '<p>China''s economy expanded 4.6% in 2025, the National Bureau of Statistics reported Tuesday, falling short of the government''s official 5% target and marking the first significant miss since the pandemic year of 2020 — a result that is likely to intensify pressure on Beijing to roll out additional stimulus measures.</p>

<h2>What Went Wrong</h2>

<p>Analysts had flagged the 5% target as ambitious given the structural headwinds China faces, including a property sector that accounts for roughly 25% of economic activity and has been in a prolonged downturn since the 2021 crackdown on developer leverage.</p>

<p>Consumer spending remained sluggish throughout 2025, with retail sales growth of 3.2% well below pre-pandemic norms. Youth unemployment, which the government controversially stopped reporting in 2023, is estimated by independent economists to be running at 18–22%.</p>

<h2>Policy Response</h2>

<p>The People''s Bank of China cut its benchmark lending rate twice in 2025 and injected liquidity through a series of targeted instruments. The central government also approved ¥1.5 trillion in special bonds for local governments and unlocked additional fiscal space for infrastructure investment. Economists say these measures are necessary but not sufficient to restore private sector confidence.</p>

<blockquote>China''s structural problems require structural solutions. Stimulus can smooth the cycle but it cannot fix the cycle.</blockquote>

<h2>Global Implications</h2>

<p>A slower Chinese economy has broad implications for global commodity prices, trade flows, and the growth outlooks of developing countries heavily dependent on Chinese demand. The IMF revised its global growth forecast down by 0.2 percentage points in January, citing China''s deceleration as the primary factor.</p>'
),

(
  'UK Government to Nationalize Water Companies After Pollution Scandal',
  'uk-nationalise-water-companies',
  'Prime Minister Keir Starmer announced the government will take Thames Water and Southern Water into temporary public ownership after a parliamentary inquiry found systemic failures in the industry.',
  'https://picsum.photos/seed/uk-water-nationalise/800/450',
  'politics',
  'global',
  ARRAY['uk', 'water', 'nationalisation', 'thames water', 'pollution', 'starmer'],
  'YUP World Desk',
  1876,
  'published',
  false,
  NOW() - INTERVAL '3 days',
  '<p>Prime Minister Keir Starmer announced on Wednesday that the British government will place Thames Water and Southern Water into temporary special administration — effectively nationalization — following a parliamentary committee''s findings that the companies had systematically underinvested in infrastructure while paying billions in dividends and bonuses to executives and shareholders.</p>

<h2>The Trigger</h2>

<p>The announcement came two weeks after a damning inquiry report documented more than 400,000 illegal sewage discharges into rivers and coastal waters by the two companies over a five-year period, including outflows near designated swimming beaches and protected chalk streams.</p>

<p>Thames Water, the UK''s largest water utility serving 15 million customers in London and surrounding areas, had been on the verge of financial collapse after failing to refinance £18.3 billion in debt and warning that it could run out of money by the spring.</p>

<h2>Government Rationale</h2>

<p>"Water is not a luxury. It is not a commodity. It is a right," Starmer told a packed House of Commons chamber. "We did not enter government to nationalize water companies. We entered government to make water companies work. They have failed to do so, and we will not allow that failure to be visited on the public."</p>

<blockquote>The era of using customers'' bills to fund dividends while pumping sewage into our rivers is over.</blockquote>

<h2>Financial Arrangements</h2>

<p>Existing shareholders will receive a nominal settlement subject to arbitration, a process that industry lawyers say is likely to trigger legal challenges under bilateral investment treaties. The Water Industry Act 1991 provides the legal framework for the special administration regime.</p>'
),

(
  'WHO Declares End to Mpox Emergency as Vaccination Campaign Succeeds',
  'who-mpox-emergency-ends-2026',
  'The World Health Organization has lifted the public health emergency of international concern for mpox, citing dramatically reduced case counts and successful vaccination rollouts across affected regions.',
  'https://picsum.photos/seed/who-mpox-vaccination/800/450',
  'health',
  'global',
  ARRAY['mpox', 'who', 'vaccination', 'public health', 'global health'],
  'YUP Health Desk',
  1102,
  'published',
  false,
  NOW() - INTERVAL '4 days',
  '<p>The World Health Organization declared the end of the public health emergency of international concern for mpox on Thursday, citing a greater than 90% reduction in reported cases from peak levels and the successful rollout of vaccination campaigns across sub-Saharan Africa, Europe, and North America.</p>

<h2>The Campaign''s Success</h2>

<p>More than 42 million doses of the Bavarian Nordic JYNNEOS vaccine were administered globally over the 18-month emergency period, with the Democratic Republic of Congo — the epicenter of the most recent outbreak — receiving approximately 8 million doses through a combination of bilateral donations and COVAX-equivalent pooled procurement.</p>

<p>WHO Director-General Tedros Adhanom Ghebreyesus credited the response as evidence that "the international community can work together on health emergencies when the political will exists and the financing is there from the start."</p>

<h2>Ongoing Surveillance</h2>

<p>Despite the lifting of the emergency designation, WHO officials emphasized that mpox remains an endemic disease in parts of central and west Africa and that surveillance systems established during the emergency period would be maintained. A new resolution before the World Health Assembly would make expanded mpox surveillance a permanent part of the International Health Regulations framework.</p>

<blockquote>Ending the emergency does not mean ending our work. It means the work has entered a new and more sustainable phase.</blockquote>

<h2>Lessons for the Future</h2>

<p>Public health experts said the response demonstrated both the potential of the Pandemic Accord being negotiated under WHO auspices — and its limitations, as equitable vaccine access required months of political negotiation even after an effective vaccine existed.</p>'
),

(
  'India Overtakes Japan to Become World''s Fourth Largest Economy',
  'india-overtakes-japan-fourth-economy',
  'IMF data confirms India''s GDP crossed the $4.9 trillion threshold in 2025 in nominal dollar terms, a milestone that reflects the country''s decade of sustained 6-7% growth.',
  'https://picsum.photos/seed/india-gdp-milestone/800/450',
  'business',
  'global',
  ARRAY['india', 'economy', 'gdp', 'growth', 'emerging markets'],
  'YUP World Desk',
  3210,
  'published',
  false,
  NOW() - INTERVAL '5 days',
  '<p>India has overtaken Japan to become the world''s fourth-largest economy by nominal GDP, according to data released Tuesday by the International Monetary Fund, confirming a milestone that economists had projected would occur sometime in the mid-2020s as the country''s sustained growth ran up against Japan''s relative stagnation.</p>

<h2>The Numbers</h2>

<p>India''s GDP reached $4.94 trillion in 2025 at current dollar exchange rates, edging past Japan''s $4.91 trillion as the yen''s persistent weakness against the dollar reduced the nominal size of the Japanese economy in comparative terms. Germany and the United Kingdom remain in third and sixth place, respectively, with the United States and China maintaining clear leads in first and second.</p>

<p>In purchasing power parity terms — which adjust for differences in price levels — India has been the world''s third-largest economy since 2019, behind only the US and China.</p>

<h2>What Drove the Growth</h2>

<p>India''s economy has expanded at an average of 6.5% annually over the past decade, fueled by a large and growing working-age population, rapid digitization of commerce and public services, and significant foreign direct investment in manufacturing — particularly in electronics, pharmaceuticals, and renewable energy.</p>

<blockquote>India''s economic story is not a miracle. It is the result of 30 years of difficult institutional reform and 1.4 billion people who refused to wait.</blockquote>

<h2>The Road Ahead</h2>

<p>At current growth rates, India is projected to overtake Germany to claim third place by 2028–2030 and potentially challenge the United States for the second spot by 2050, though economists caution that projections over such long horizons are inherently uncertain. Structural challenges — including uneven income distribution, infrastructure gaps, and agricultural productivity — remain significant.</p>'
),

(
  'France Elects First Female Prime Minister in Snap Parliamentary Vote',
  'france-first-female-prime-minister',
  'Anne-Laure Delacroix, 44, was confirmed by the National Assembly on a narrow majority, becoming the first woman to hold France''s second-highest office in the republic''s history.',
  'https://picsum.photos/seed/france-prime-minister/800/450',
  'politics',
  'global',
  ARRAY['france', 'politics', 'prime minister', 'elections', 'europe'],
  'YUP World Desk',
  4102,
  'published',
  false,
  NOW() - INTERVAL '6 days',
  '<p>France confirmed Anne-Laure Delacroix as its new prime minister on Wednesday in a vote of confidence in the National Assembly, making her the first woman to hold the office in the 65-year history of the Fifth Republic and the first leader of the centrist Renaissance party to occupy Matignon since Emmanuel Macron assumed the presidency.</p>

<h2>Who Is Delacroix?</h2>

<p>Delacroix, 44, is a former investment banker and EU trade commissioner who entered national politics in 2019. She served as Minister of Finance from 2022 to 2024, overseeing France''s response to the energy crisis that followed Russia''s invasion of Ukraine, before being appointed to the more junior European Affairs ministry following a cabinet reshuffle.</p>

<p>Macron''s decision to nominate her came after two previous prime ministers lost votes of no-confidence within months of their appointments, driven by a deeply fragmented National Assembly in which no single bloc holds a working majority.</p>

<h2>The Governing Challenge</h2>

<p>Delacroix will face the same structural challenge that defeated her predecessors: passing legislation through an assembly split among a centrist bloc, a resurgent left alliance, a consolidated far-right grouping, and a conservative bloc that has oscillated between cooperation and opposition.</p>

<blockquote>I have not come to Matignon to manage decline. I have come to govern. The assembly will have to decide if it wants the same.</blockquote>

<h2>European Reaction</h2>

<p>European Council President Ursula von der Leyen offered congratulations, calling Delacroix "a formidable advocate for European unity and competitiveness." The German government expressed hope that her appointment would reinvigorate the Franco-German engine at the heart of European policymaking.</p>'
),

(
  'Arctic Ice Sheet Hits Smallest Winter Extent on Record',
  'arctic-ice-smallest-winter-record-2026',
  'Satellite data show Arctic sea ice reached its peak winter extent of 14.1 million square kilometers — the lowest maximum ever recorded — as ocean temperatures in the region remain anomalously warm.',
  'https://picsum.photos/seed/arctic-ice-record/800/450',
  'health',
  'global',
  ARRAY['arctic', 'climate change', 'sea ice', 'environment', 'global warming'],
  'YUP Environment Desk',
  1654,
  'published',
  false,
  NOW() - INTERVAL '7 days',
  '<p>Arctic sea ice reached its annual maximum winter extent of just 14.1 million square kilometers in February, the smallest winter maximum ever recorded in the 47-year satellite record, according to data released Monday by the National Snow and Ice Data Center.</p>

<h2>The Record in Context</h2>

<p>The previous record winter minimum was 14.52 million square kilometers, set in 2017. The 2026 figure is 1.1 million square kilometers below the 1981–2010 average — an area roughly the size of France and Germany combined.</p>

<p>Arctic sea ice extent has been declining at approximately 2.6% per decade during the winter maximum season, a slower rate than the summer minimum decline but one that climate scientists say has significant long-term implications for Arctic albedo, ocean circulation, and polar weather patterns.</p>

<h2>Why It Matters Beyond the Arctic</h2>

<p>The Arctic is warming roughly four times faster than the global average — a phenomenon known as Arctic amplification — and the consequences extend well beyond the polar region. Research published in the journal <em>Nature</em> last year linked accelerated Arctic warming to increased frequency and persistence of extreme weather events at mid-latitudes, including the heat domes, atmospheric rivers, and polar vortex disruptions that have become increasingly familiar in recent years.</p>

<blockquote>We are conducting an uncontrolled experiment on the only climate system we have. The Arctic is where we see the results first.</blockquote>

<h2>Summer Outlook</h2>

<p>The anomalously warm winter conditions increase the probability of a record-low summer sea ice minimum in September. Several models project a first ice-free Arctic summer — meaning less than one million square kilometers of sea ice — could occur within the next decade.</p>'
),

(
  'Gaza Ceasefire Enters Fragile Second Phase as Aid Convoys Reach North',
  'gaza-ceasefire-second-phase-aid',
  'Relief agencies describe a humanitarian situation that remains desperate despite the flow of supplies, while negotiators work to extend the truce into a permanent agreement.',
  'https://picsum.photos/seed/gaza-ceasefire-aid/800/450',
  'politics',
  'global',
  ARRAY['gaza', 'ceasefire', 'middle east', 'humanitarian', 'israel', 'palestine'],
  'YUP World Desk',
  5632,
  'published',
  false,
  NOW() - INTERVAL '9 hours',
  '<p>Aid convoys reached northern Gaza for the first time in months on Wednesday as the ceasefire agreement between Israel and Hamas entered its second phase, though UN officials warned that the volume of assistance flowing into the territory remained far below what is needed to address what they described as a catastrophic humanitarian situation.</p>

<h2>The Second Phase</h2>

<p>Under the terms of the agreement brokered by Qatar, Egypt, and the United States, the second phase involves the release of remaining Israeli hostages in exchange for further Palestinian prisoner releases and an Israeli military withdrawal from specified zones. Negotiators from all sides have described the transition to phase two as more complex than the first phase, with several sticking points still unresolved.</p>

<p>An Israeli government spokesperson said the second phase would last "as long as is necessary" to secure the release of all remaining hostages, a formulation that left open the question of whether the truce would outlast the hostage negotiations.</p>

<h2>Humanitarian Conditions</h2>

<p>World Food Programme officials said that despite the resumption of aid flows, approximately 60% of Gaza''s population remains in acute food insecurity. Medical facilities that survived the conflict are overwhelmed, with the WHO documenting outbreaks of Hepatitis A, diarrheal disease, and scabies in displacement shelters.</p>

<blockquote>A ceasefire is the beginning of relief, not relief itself. The scale of reconstruction needed here is almost beyond comprehension.</blockquote>

<h2>Reconstruction Talks</h2>

<p>The European Union, Gulf states, and several international financial institutions have begun preliminary discussions about a post-conflict reconstruction financing framework, though officials acknowledge that any meaningful reconstruction plan requires a clearer political framework for Gaza''s future governance.</p>'
),

(
  'SpaceX Artemis Launch Carries First Crew to Lunar Orbit in 50 Years',
  'spacex-artemis-lunar-orbit-2026',
  'The historic mission, a joint NASA-SpaceX venture, placed four astronauts in stable lunar orbit on schedule — the first humans to reach the Moon''s vicinity since Apollo 17 in 1972.',
  'https://picsum.photos/seed/spacex-artemis-moon/800/450',
  'technology',
  'global',
  ARRAY['spacex', 'nasa', 'artemis', 'moon', 'space', 'astronauts'],
  'YUP Science Desk',
  8903,
  'published',
  false,
  NOW() - INTERVAL '4 hours',
  '<p>Four astronauts aboard the Starship HLS lunar module entered stable orbit around the Moon on Friday morning, NASA confirmed, completing the first crewed lunar orbital insertion since Apollo 17 in December 1972 and setting the stage for a surface landing attempt in the coming days.</p>

<h2>The Crew</h2>

<p>Commander Zara Ahmed, 41, a veteran of two International Space Station missions, leads the crew alongside mission pilot Carlos Medina, lunar module pilot Dr. Amara Osei — a Ghanaian-American geologist who will be the first African-born human to walk on the Moon — and mission specialist Dr. Jennifer Park, a Korean-American physician.</p>

<p>The crew launched from Kennedy Space Center three days ago aboard a SpaceX Falcon Heavy, transferring to the Starship lunar surface vehicle in cislunar space after a flawless rendezvous with the HLS vehicle.</p>

<h2>The Mission Plan</h2>

<p>After two days of lunar orbital operations and systems checks, Ahmed and Osei will descend to the lunar surface near the Shackleton Crater at the Moon''s south pole — a region selected for its proximity to permanently shadowed areas believed to harbor water ice. Park and Medina will remain in the orbiting Starship command module.</p>

<p>The surface crew is scheduled to spend approximately 6 days on the lunar surface, conducting geological surveys and deploying instruments for the nascent Lunar Gateway outpost program.</p>

<blockquote>To be honest, the Moon looks smaller from here than I expected. And more beautiful than any picture prepared me for.</blockquote>

<h2>Global Reaction</h2>

<p>The mission has drawn widespread international attention, with live viewing events organized across six continents. President Biden called it "a reminder that when America commits to something, America delivers." Chinese state media, covering the mission extensively, noted that China''s own crewed lunar program aims for a surface landing by 2030.</p>'
),

(
  'Global Food Prices Rise for Fifth Straight Month, WFP Warns of Crisis',
  'global-food-prices-five-months-wfp-crisis',
  'The UN''s Food and Agriculture Organization index rose 1.3% in January, pushed by surging grain and vegetable oil costs, as the World Food Programme issued its starkest warning in years about food insecurity.',
  'https://picsum.photos/seed/global-food-prices/800/450',
  'health',
  'global',
  ARRAY['food security', 'prices', 'inflation', 'wfp', 'famine', 'global'],
  'YUP World Desk',
  1230,
  'published',
  false,
  NOW() - INTERVAL '8 hours',
  '<p>Global food prices rose for the fifth consecutive month in January, with the United Nations Food and Agriculture Organization''s Food Price Index climbing 1.3% from December to reach its highest level since early 2023 — a trend that the World Food Programme warned on Friday was pushing tens of millions of people deeper into food insecurity.</p>

<h2>What''s Driving Prices</h2>

<p>Grain prices — the largest component of the FAO index — rose 2.1% in January as drought conditions in major wheat-producing regions of India and Australia reduced yield forecasts. Vegetable oil prices jumped 3.4%, reflecting tighter palm oil supplies from Indonesia and Malaysia following an unusually dry La Niña-affected season.</p>

<p>Sugar prices declined slightly, providing the only major relief in an otherwise upward-moving index. Meat and dairy prices were broadly stable.</p>

<h2>The Human Cost</h2>

<p>The WFP''s latest hunger data, released alongside the FAO figures, estimates that 344 million people face acute food insecurity globally — a figure that has not declined meaningfully since the post-COVID peak — with 42 million people in IPC Phase 4 (emergency) or Phase 5 (catastrophic/famine) conditions.</p>

<p>Sudan, Gaza, South Sudan, Haiti, and eastern Democratic Republic of Congo are identified as the most critical situations, with Sudan in particular showing deteriorating indicators that the WFP said are consistent with famine conditions in some areas.</p>

<blockquote>The combination of conflict, climate, and currency crises in the most vulnerable countries has created a humanitarian system under strain unlike anything we have seen since the post-World War II period.</blockquote>

<h2>Policy Response</h2>

<p>The G7 agriculture ministers issued a joint statement calling for increased funding for WFP operations, which face a $5.5 billion funding gap in 2026. The United States announced an additional $450 million in emergency food assistance, while the EU committed €300 million through its humanitarian ECHO instrument.</p>'
);
