# **CREATE 2026 Team Hackathon Playbook**

**Somehow We Manage**

| Event detail | Confirmed information |
| :---- | :---- |
| Build day | Friday 11 September 2026 |
| Build window | 2:00 PM to 11:59 PM IST |
| Location | Runwal R Square Mumbai |
| Showcase | Friday 18 September at 10:00 AM IST |
| Demo day | Friday 18 September at 2:00 PM IST |

**Purpose.** This playbook gives the team one operating plan for selecting an idea, building a working prototype, deploying it safely and submitting it before the hard deadline.

**Main conclusion.** A focused and polished product with one convincing end to end workflow is the strongest strategy for this ten hour sprint.

# **How the hackathon works**

**1\.** At 2:00 PM IST on Friday the organisers reveal the secret theme and open submissions.

**2\.** The team identifies a real problem that fits the theme and chooses one new idea.

**3\.** Design, development, testing and deployment happen during the ten hour build window.

**4\.** The Main Builder deploys the final project to the team’s organiser provided Netlify project.

**5\.** The Captain submits the public Netlify URL through the Project Submission panel before 11:59 PM IST.

**6\.** After the deadline the submitted deployment is frozen. The showcase and demo day take place the following Friday.

## **Judging priorities**

| Weight | Question the project must answer | Practical implication |
| :---: | :---- | :---- |
| 30 | Does it actually work? | Protect the complete demo path before adding features. |
| 25 | Is the problem real? | Use a problem people immediately recognise. |
| 25 | Craft and clarity | Make the experience understandable within 30 seconds. |
| 20 | Did the team attempt something hard? | Include one ambitious element that visibly works. |

**Winning principle.** Build one reliable golden workflow. A smaller finished product will usually outperform a broad concept with broken or incomplete sections.

# **Team roles and working ownership**

These responsibilities are a proposed working split and can be adjusted by the team before Friday.

| Team member | Registered role | Proposed ownership |
| :---- | :---- | :---- |
| Namrata Arya | Storyteller and Captain | Problem narrative, pitch, submission and demo coordination |
| Pratik Sane | Thinker | Problem validation, scope control, testing and timekeeping |
| Swapnil Kadam | Designer | User flow, layout, copy and visual consistency |
| Mayur Ghadi | Builder | Technical responsibilities to be agreed during the team discussion |
| Abhijeet Bhowmick | Builder | Technical responsibilities to be agreed during the team discussion |

**Important.** The two Builders should agree their working split with the team before Friday, including who will act as Main Builder and deployment owner. Only the Captain or an appointed Co Captain can submit the project through the event site.

# **Preparation before Friday**

## **Confirm access and technical ownership**

☐  Confirm whether Abhijeet or Mayur received the organiser provided Netlify invitation.

☐  Accept the invitation using the invited Radix email address.

☐  Agree who owns the Git repository, final merge and production deployment.

☐  Confirm the team can access the CREATE 2026 site using Radix Google login.

☐  Confirm the team has its one Claude premium seat if it intends to use it.

## **Verify the Builder workstation**

☐  Git and repository authentication work.

☐  Node.js and npm are installed and usable.

☐  The chosen code editor and Claude Code are signed in and tested.

☐  A basic React and Vite project can run locally.

☐  Charger, mouse, hotspot and headphones are ready.

## **Agree on team guardrails**

* Consider three ideas and choose one within 45 minutes of the theme reveal.  
* Define one primary user and one main end to end workflow.  
* Reach a working MVP by about 7:00 PM.  
* Stop adding features by 9:00 PM.  
* Aim for the final production deployment by 10:30 PM.  
* Start the pitch and submission description while development continues.  
* Do not allow late AI generated rewrites of the entire application.

## **Prepare problems without prebuilding an idea**

The theme is intentionally hidden and the submitted idea must be new. The team can still collect real problems in advance, such as:

* Repetitive internal work or follow ups  
* Information employees or customers struggle to find  
* Decisions made from scattered or unclear data  
* Operational anomalies, delays or avoidable waste  
* Approval and handoff friction between teams  
* Manual reporting, reconciliation or status tracking

## **Decisions for tomorrow's discussion**

☐  Builder task split, Main Builder and deployment owner

☐  Owner of the team Claude premium seat

☐  Likely presentation narrator and live demo driver

☐  Single communication channel for the build window

☐  Final checkpoints for feature freeze, deployment and submission

# **Friday run of show**

| Time | Outcome | Primary owners |
| :---- | :---- | :---- |
| 2:00 to 2:20 | Understand the theme and collect candidate problems | Whole team |
| 2:20 to 2:45 | Score the best three ideas and choose one | Namrata and Pratik |
| 2:45 to 3:15 | Define user, problem, golden workflow and demo ending | Whole team |
| 3:15 to 4:00 | Create user flow, repository and application skeleton | Swapnil and Builders |
| 4:00 to 7:00 | Build the complete working core | Abhijeet and Mayur |
| 7:00 | Run the first complete end to end demo | Whole team |
| 7:00 to 9:00 | Improve usability, reliability and visible impact | Whole team |
| 9:00 | Freeze features | Pratik |
| 9:00 to 10:00 | Test, repair and prepare fallback data | Pratik and Builders |
| 10:00 to 10:30 | Deploy to Netlify and test in Incognito | Main Builder |
| 10:30 to 11:00 | Complete the submission fields | Namrata |
| 11:00 to 11:30 | Run final verification and demo rehearsal | Whole team |
| 11:30 to 11:59 | Emergency buffer only | Captain and Builders |

# **Idea selection scorecard**

Score each shortlisted idea from 1 to 5, multiply by the weight and select the strongest feasible option.

| Decision question | Weight | Score 1 to 5 |
| :---- | :---: | :---: |
| Can the main workflow genuinely work today? | 30 percent |  |
| Is this a problem people immediately recognise? | 25 percent |  |
| Can someone understand the value within 30 seconds? | 25 percent |  |
| Does it contain one impressive and difficult element? | 20 percent |  |

## **Ideas to avoid**

Avoid ideas that require several external systems, corporate authentication, production data access, multiple major user journeys, or an unreliable paid API without a fallback. Keep the ambitious element inside a product that the team can still finish and demonstrate.

# **Builder operating strategy**

**Preferred product shape:** Problem → User input → Useful processing or AI → Clear result → One meaningful action.

**Avoid:** Login → Dashboard → Many menus → Several integrations → An unfinished assistant.

## **Recommended technical shape**

* React and Vite frontend deployed through the assigned Netlify project.  
* Local JSON or a lightweight datastore where realistic sample data is sufficient.  
* Netlify Functions only when a secret or protected API call is genuinely necessary.  
* One critical AI interaction rather than AI added to every screen.  
* A deterministic fallback path if an external API or AI service fails.  
* No unnecessary cloud infrastructure during the sprint.

## **Two Builder coordination**

* One Builder owns architecture, integration, production and the main branch.  
* The second Builder owns one isolated feature or component with clear file boundaries.  
* Use short branches or agreed file ownership to prevent simultaneous conflicting edits.  
* Merge early enough to test the complete application by 7:00 PM.  
* Only the deployment owner changes production settings or the Netlify connection.

## **Prompt to use after idea selection**

| We are building a hackathon prototype in under 10 hours.Theme: \[PASTE THEME\]Problem: \[ONE SENTENCE\]Primary user: \[ONE USER\]Golden workflow: 1\. \[...\] 2\. \[...\] 3\. \[...\]Demo must prove: \[VISIBLE END RESULT\]Stack: React and Vite, deployed on Netlify. Constraints: one working workflow, mobile friendly UI, no unnecessary infrastructure and no secrets in frontend code.First produce: minimum architecture, exact MVP scope, file structure, implementation order and risks that could prevent deployment. Do not code until the scope is approved. |
| :---- |

# **Deployment and submission**

## **Netlify process**

**1\.** Use the organiser provided Netlify project. Do not create a separate competition site.

**2\.** Link the team repository to that project and allow Netlify to deploy it.

**3\.** Rename the default Netlify URL to an identifiable team or project name before submission.

**4\.** Open the production URL in an Incognito or Private window and test the full demo path.

**5\.** Give the final URL and project information to Namrata for submission.

## **Captain submission checklist**

☐  Project name is final and easy to understand.

☐  Description explains the user, real problem and result in 500 characters or fewer.

☐  Correct public Netlify URL is entered.

☐  Up to five useful discovery tags are added if appropriate.

☐  Submission is saved well before 11:59 PM IST.

## **Final technical checklist**

☐  Final build is live.

☐  URL opens in Incognito without any login.

☐  The primary workflow works from a fresh browser.

☐  There are no broken buttons or dead navigation paths in the demo.

☐  External APIs and backends are operational.

☐  No API key or secret appears in frontend code.

☐  The submitted URL exactly matches the verified production URL.

☐  The Netlify site name and submitted URL will not change after submission.

**After the deadline.** The organisers change the Main Builder’s Netlify access from Developer to Reviewer and lock auto publishing. Any external backend, database or API configuration must also remain unchanged so judges see the submitted version.

# **Pitch preparation**

* Opening hook: identify the user and a recognisable problem.  
* Current pain: explain briefly how the problem is handled today.  
* Live demonstration: show the complete golden workflow as early as possible.  
* Value: show one clear before and after outcome.  
* How it works: explain the technical approach only after the result is visible.  
* Ambition and close: identify the difficult element and finish with one memorable outcome.  
* Keep screenshots or a short backup recording in case the live service fails on demo day.

**Suggested presentation setup.** Use one narrator and one demo driver without passing the laptop between people. Swapnil can support visual consistency and Pratik can prepare likely judge questions. Final ownership should be agreed tomorrow.

# **Official source and support**

Event information and current submission rules: [CREATE 2026 official site](https://create.radix360.site/). Details checked on 9 September 2026\. For deployment issues, the event page directs participants to Minita or Leo.