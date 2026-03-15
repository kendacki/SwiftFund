# Supabase setup for SwiftFund

Projects (including drafts) and approvals are stored in Supabase so creators can access their drafts later and only you can approve projects.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a project.
2. In **Settings → API**: copy the **Project URL** and the **service_role** key (not the anon key).

## 2. Create the `projects` table

In the Supabase dashboard, open **SQL Editor** and run the contents of `migrations/001_projects.sql`.

## 3. Environment variables

Add to `.env.local` (and to Vercel if you deploy):

- `NEXT_PUBLIC_SUPABASE_URL` = your Project URL  
- `SUPABASE_SERVICE_ROLE_KEY` = your service_role key  
- `APPROVER_SECRET` = a secret string only you know (used to approve projects)

## 4. Where data is stored

- **Drafts and all projects** are saved in the Supabase `projects` table. When a creator clicks “Save as draft” or “Submit for approval”, the project is stored there and they can open it again from “My Projects”.
- **Cover images and PDFs** are still uploaded to Vercel Blob; only the URLs are stored in Supabase.
- **Approvals**: only requests that send your `APPROVER_SECRET` (e.g. `POST /api/projects/approve` with header `x-approver-secret`) can set a project to approved. Creators cannot self-approve.

## 5. Approving a project

From your own script or tool (e.g. curl):

```bash
curl -X POST "https://your-app.vercel.app/api/projects/approve" \
  -H "Content-Type: application/json" \
  -H "x-approver-secret: YOUR_APPROVER_SECRET" \
  -d '{"projectId": "proj_1234567890_abc1234"}'
```

You can also change status to `processing` with `{"projectId": "...", "status": "processing"}`.

To see pending projects, query the `projects` table in the Supabase dashboard (filter by `status = 'pending'`) or use your own admin UI that calls the API with the approver secret.
