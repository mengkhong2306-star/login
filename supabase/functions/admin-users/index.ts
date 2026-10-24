import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins = new Set([
    "https://mengkhong2306-star.github.io",
    "http://127.0.0.1:8765",
    "http://localhost:8765",
]);

Deno.serve(async (request: Request) => {
    const origin = request.headers.get("origin");
    if (origin && !allowedOrigins.has(origin)) {
        return Response.json({ error: "Origin not allowed." }, { status: 403 });
    }

    const corsHeaders = {
        "Access-Control-Allow-Origin": origin || "https://mengkhong2306-star.github.io",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Vary": "Origin",
    };

    if (request.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }
    if (request.method !== "POST") {
        return Response.json(
            { error: "Method not allowed." },
            { status: 405, headers: corsHeaders },
        );
    }

    let body: { action?: string; email?: string; username?: string; user_id?: string };
    try {
        body = await request.json();
    } catch {
        return Response.json(
            { error: "A valid JSON request body is required." },
            { status: 400, headers: corsHeaders },
        );
    }
    if (!["list", "invite", "delete"].includes(body.action || "")) {
        return Response.json(
            { error: "Unsupported admin action." },
            { status: 400, headers: corsHeaders },
        );
    }

    const authorization = request.headers.get("authorization") || "";
    const accessToken = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!accessToken) {
        return Response.json(
            { error: "Sign-in is required." },
            { status: 401, headers: corsHeaders },
        );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
        console.error("Required Supabase function environment variables are missing.");
        return Response.json(
            { error: "Admin service is not configured." },
            { status: 500, headers: corsHeaders },
        );
    }

    const authClient = createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authError } = await authClient.auth.getUser(accessToken);
    if (authError || !authData.user) {
        return Response.json(
            { error: "A valid sign-in is required." },
            { status: 401, headers: corsHeaders },
        );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: adminRecord, error: adminError } = await adminClient
        .from("admin_users")
        .select("user_id")
        .eq("user_id", authData.user.id)
        .maybeSingle();

    if (adminError) {
        console.error("Admin membership check failed:", adminError.message);
        return Response.json(
            { error: "Could not verify administrator access." },
            { status: 500, headers: corsHeaders },
        );
    }
    if (!adminRecord) {
        return Response.json(
            { error: "Administrator access is required." },
            { status: 403, headers: corsHeaders },
        );
    }

    if (body.action === "invite") {
        const email = body.email?.trim().toLowerCase();
        const username = body.username?.trim().toLowerCase();
        if (!email || email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
            return Response.json(
                { error: "Enter a valid email address." },
                { status: 400, headers: corsHeaders },
            );
        }
        if (!username || username.length > 80) {
            return Response.json(
                { error: "Username must be between 1 and 80 characters." },
                { status: 400, headers: corsHeaders },
            );
        }

        const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
            data: { username },
            redirectTo: "https://mengkhong2306-star.github.io/login/",
        });
        if (error) {
            console.error("Could not invite user:", error.message);
            return Response.json(
                { error: error.message },
                { status: 400, headers: corsHeaders },
            );
        }
        return Response.json(
            { user_id: data.user.id },
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    }

    if (body.action === "delete") {
        if (!body.user_id || !/^[0-9a-f-]{36}$/i.test(body.user_id)) {
            return Response.json(
                { error: "A valid user ID is required." },
                { status: 400, headers: corsHeaders },
            );
        }
        if (body.user_id === authData.user.id) {
            return Response.json(
                { error: "You cannot remove your own signed-in admin account." },
                { status: 400, headers: corsHeaders },
            );
        }
        const { data: targetAdmin, error: targetAdminError } = await adminClient
            .from("admin_users")
            .select("user_id")
            .eq("user_id", body.user_id)
            .maybeSingle();
        if (targetAdminError) {
            console.error("Could not verify target account role:", targetAdminError.message);
            return Response.json(
                { error: "Could not verify the account role." },
                { status: 500, headers: corsHeaders },
            );
        }
        if (targetAdmin) {
            return Response.json(
                { error: "Remove administrator access before removing this account." },
                { status: 400, headers: corsHeaders },
            );
        }
        const { error } = await adminClient.auth.admin.deleteUser(body.user_id);
        if (error) {
            console.error("Could not remove user:", error.message);
            return Response.json(
                { error: error.message },
                { status: 400, headers: corsHeaders },
            );
        }
        return Response.json(
            { deleted: true },
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    }

    const users = [];
    for (let page = 1; ; page += 1) {
        const { data, error } = await adminClient.auth.admin.listUsers({
            page,
            perPage: 1000,
        });
        if (error) {
            console.error("Could not list auth users:", error.message);
            return Response.json(
                { error: "Could not load account list." },
                { status: 500, headers: corsHeaders },
            );
        }
        users.push(...data.users);
        if (data.users.length < 1000) break;
    }

    const [{ data: profiles, error: profilesError }, { data: activity, error: activityError }] =
        await Promise.all([
            adminClient.from("profiles").select("id, username"),
            adminClient.rpc("admin_user_last_sign_ins"),
        ]);

    if (profilesError || activityError) {
        console.error(
            "Could not load account activity:",
            profilesError?.message || activityError?.message,
        );
        return Response.json(
            { error: "Could not load account activity." },
            { status: 500, headers: corsHeaders },
        );
    }

    const usernameById = new Map(profiles.map((profile) => [profile.id, profile.username]));
    const lastSignInById = new Map(
        activity.map((entry) => [entry.user_id, entry.last_sign_in_at]),
    );
    const responseUsers = users.map((user) => ({
        id: user.id,
        username: usernameById.get(user.id) || "—",
        email: user.email || "—",
        created_at: user.created_at,
        last_sign_in_at: lastSignInById.get(user.id) || null,
    }));

    return Response.json(
        { users: responseUsers },
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
});
