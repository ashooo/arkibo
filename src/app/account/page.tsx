"use client";

import { ScholarMascot } from "@/components/ui/scholar-mascot";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowLeft, ChevronDown, CloudUpload, GraduationCap, Save, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { accountRequest, alertTopics, educationYears, isEducationLevel, maxProfilePhotoBytes, schoolName } from "@/lib/account";
import { useStudent } from "@/lib/student-context";

const field = "grid min-w-0 gap-2 text-sm font-semibold";
const select = "block h-10 w-full min-w-0 max-w-full appearance-none truncate rounded-md border border-slate-border bg-surface-lowest pl-3 pr-10 text-sm dark:border-dark-border dark:bg-dark-card";

export default function AccountPage() {
  const router = useRouter();
  const { user, setUser, accountLoading } = useStudent();
  const [signingIn, setSigningIn] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; error?: boolean }>();
  const profile = user?.profile;
  const [selectedLevel, setSelectedLevel] = useState("");
  const educationLevel = selectedLevel || profile?.educationLevel || (profile ? "College" : "");
  const availableYears = isEducationLevel(educationLevel) ? educationYears[educationLevel] : [];
  const heading = user ? "Student profile" : signingIn ? "Sign in" : "Create your account";

  async function submitCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const credentials = {
      email: String(data.get("email")).trim(),
      password: String(data.get("password")),
    };
    setBusy(true);
    setFeedback(undefined);
    try {
      const account = await accountRequest("POST", { action: signingIn ? "signin" : "signup", ...credentials });
      setUser(account);
      if (account?.profile) router.replace("/dashboard");
    } catch (error) {
      setFeedback({ text: error instanceof Error ? error.message : "Couldn’t reach the account service. Try again.", error: true });
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const data = new FormData(event.currentTarget);
    const firstName = String(data.get("firstName")).trim();
    const middleName = String(data.get("middleName")).trim();
    const lastName = String(data.get("lastName")).trim();
    const school = String(data.get("school")).trim();
    const yearLevel = String(data.get("year"));
    const track = data.get("track");
    if (!firstName || !lastName || !school || !availableYears.includes(yearLevel) || (track !== "new" && track !== "renewal")) {
      setFeedback({ text: "Enter your name and school, then select your education level, grade or year, and application track.", error: true });
      return;
    }
    setBusy(true);
    setFeedback(undefined);
    try {
      const file = selectedPhoto;
      let photo: string | null | undefined = data.has("removePhoto") ? null : undefined;
      if (file instanceof File && file.size > 0) {
        if (file.size > maxProfilePhotoBytes || !["image/jpeg", "image/png"].includes(file.type)) {
          throw new Error("Choose a JPG or PNG photo up to 512 KB.");
        }
        photo = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error("Couldn’t read the photo. Try another file."));
          reader.readAsDataURL(file);
        });
      }
      setUser(await accountRequest("POST", {
        action: "profile", firstName, middleName, lastName, school, educationLevel, yearLevel, track, topics: data.getAll("topics"), photo,
      }));
      router.replace("/dashboard");
    } catch (error) {
      setFeedback({ text: error instanceof Error ? error.message : "Couldn’t save your profile. Try again.", error: true });
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setFeedback(undefined);
    try {
      setUser(await accountRequest("POST", { action: "signout" }));
      setSelectedPhoto(null);
      setSelectedLevel("");
      setSigningIn(true);
    } catch {
      setFeedback({ text: "Couldn’t sign out. Try again.", error: true });
    }
  }

  return (
    <div className="public-scene min-h-dvh bg-surface dark:bg-dark-bg">
      <header className="flex min-h-16 flex-wrap items-center justify-between gap-2 border-b border-slate-border bg-surface-lowest px-4 py-2 dark:border-dark-border dark:bg-dark-surface sm:px-8">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <GraduationCap aria-hidden="true" className="text-primary" size={24} /> ScholarReady
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/notifications" className="text-sm font-semibold text-primary hover:underline">Announcements</Link>
          <ThemeToggle />
        </div>
      </header>

      <main className={`mx-auto px-4 py-8 sm:px-6 sm:py-12 ${user ? "max-w-6xl" : "max-w-xl"}`}>
        {profile && (
          <Link href="/dashboard" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft aria-hidden="true" size={16} /> Go back to Home
          </Link>
        )}
        <section className="space-y-6 rounded-2xl border border-slate-border bg-surface-lowest p-5 dark:border-dark-border dark:bg-dark-card sm:p-9">
          {!user && <ScholarMascot />}
          <h1 className={user ? "flex items-center gap-3 border-b border-slate-border pb-5 text-2xl font-semibold tracking-tight dark:border-dark-border" : "text-2xl font-semibold tracking-tight"}>
            {user && <GraduationCap aria-hidden="true" size={28} className="shrink-0 text-primary" />}
            {heading}
          </h1>
          {accountLoading ? <p role="status">Checking your session…</p> : user ? (
            <form onSubmit={saveProfile} className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3" key={user.id}>
              <div className="col-span-full grid gap-4 pb-2 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-6">
                <div className="flex items-center sm:border-r sm:border-slate-border sm:pr-6 dark:sm:border-dark-border">
                  {profile?.photo ? (
                    <Image src={profile.photo} alt="" width={112} height={112} unoptimized className="size-20 rounded-full object-cover sm:size-28" />
                  ) : (
                    <span className="grid size-20 place-items-center rounded-full bg-primary-soft text-primary dark:bg-dark-accentSurface dark:text-dark-accent sm:size-28">
                      <UserRound aria-hidden="true" size={38} />
                    </span>
                  )}
                </div>
                <div className="min-w-0 max-w-2xl space-y-2">
                  <label htmlFor="profile-photo" className="block text-sm font-semibold">Profile picture (optional)</label>
                  <p id="photo-help" className="text-sm text-on-surface-variant dark:text-dark-muted">JPG or PNG, up to 512 KB.</p>
                  <div
                    className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-accent-border bg-surface px-3 py-3 text-center focus-within:outline focus-within:outline-2 focus-within:outline-focus-ring dark:border-dark-accentBorder dark:bg-dark-surface"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      const file = event.dataTransfer.files[0];
                      if (file) setSelectedPhoto(file);
                    }}
                  >
                    <CloudUpload aria-hidden="true" size={24} className="text-primary" />
                    <label className="flex cursor-pointer flex-wrap items-center justify-center gap-2 text-sm">
                      <input id="profile-photo" type="file" accept="image/jpeg,image/png" aria-describedby="photo-help" className="sr-only" onChange={(event) => setSelectedPhoto(event.currentTarget.files?.[0] ?? null)} />
                      <span className="rounded-full bg-primary px-4 py-2 font-semibold text-white">Choose file</span>
                      <span>or drag and drop</span>
                    </label>
                    {selectedPhoto && <p role="status" className="max-w-full break-all text-xs">{selectedPhoto.name}</p>}
                  </div>
                  {profile?.photo && (
                    <label className="flex min-h-9 items-center gap-2 text-sm">
                      <input type="checkbox" name="removePhoto" className="size-4 accent-primary" /> Remove current photo
                    </label>
                  )}
                </div>
              </div>
              {profile && !profile.firstName && <p className="col-span-full text-sm">Previously saved name: {profile.name}</p>}
              <label className={field}>First name<Input name="firstName" autoComplete="given-name" defaultValue={profile?.firstName} maxLength={100} required /></label>
              <label className={field}>Middle name (optional)<Input name="middleName" autoComplete="additional-name" defaultValue={profile?.middleName} maxLength={100} /></label>
              <label className={field}>Last name<Input name="lastName" autoComplete="family-name" defaultValue={profile?.lastName} maxLength={100} required /></label>
              <label className={field}>School<Input name="school" autoComplete="organization" defaultValue={profile?.school ?? (profile ? schoolName : "")} maxLength={150} required /></label>
              <label className={field}>Education level
                <span className="relative block min-w-0">
                  <select className={select} value={educationLevel} onChange={(event) => setSelectedLevel(event.target.value)} required>
                    <option value="" disabled>Select your education level</option>
                    {Object.keys(educationYears).map((level) => <option key={level}>{level}</option>)}
                  </select>
                  <ChevronDown aria-hidden="true" size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                </span>
              </label>
              <label className={field}>Grade or year level
                <span className="relative block min-w-0">
                  <select className={select} key={educationLevel} name="year" required disabled={!educationLevel} defaultValue={profile && availableYears.includes(profile.yearLevel) ? profile.yearLevel : ""}>
                    <option value="" disabled>Select your grade or year</option>
                    {availableYears.map((year) => <option key={year}>{year}</option>)}
                  </select>
                  <ChevronDown aria-hidden="true" size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                </span>
              </label>
              <label className={field}>Application track
                <span className="relative block min-w-0">
                  <select className={select} name="track" defaultValue={profile?.track ?? ""} required>
                    <option value="" disabled>Select your application track</option>
                    <option value="new">New Applicant</option>
                    <option value="renewal">Renewal Scholar</option>
                  </select>
                  <ChevronDown aria-hidden="true" size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                </span>
              </label>
              <fieldset className="col-span-full flex flex-wrap gap-x-6 gap-y-2">
                <legend className="mb-2 text-sm font-semibold">Announcement topics (optional)</legend>
                {alertTopics.map((topic) => (
                  <label className="flex min-h-9 items-center gap-3 text-sm" key={topic}>
                    <input className="size-4 accent-primary" type="checkbox" name="topics" value={topic} defaultChecked={profile?.topics.includes(topic)} />
                    {topic}
                  </label>
                ))}
              </fieldset>
              <div className="col-span-full flex flex-wrap items-center justify-end gap-3 border-t border-slate-border pt-5 dark:border-dark-border">
                {profile ? (
                  <Button type="button" variant="secondary" disabled={busy} onClick={() => router.replace("/dashboard")}>Cancel</Button>
                ) : (
                  <Button type="button" variant="secondary" disabled={busy} onClick={signOut}>Log out</Button>
                )}
                <Button type="submit" isLoading={busy}>{!busy && <Save aria-hidden="true" size={16} />}Save profile</Button>
              </div>
            </form>
          ) : (
            <>
              <form key={String(signingIn)} onSubmit={submitCredentials} className="space-y-5">
                <label className={field}>Email<Input name="email" type="email" autoComplete="email" required /></label>
                <label className={field}>Password
                  <Input name="password" type="password" autoComplete={signingIn ? "current-password" : "new-password"} minLength={signingIn ? undefined : 8} maxLength={128} required />
                  {!signingIn && <span className="text-xs font-normal">Use at least 8 characters.</span>}
                </label>
                {!signingIn && <p className="rounded-xl border border-slate-border bg-primary-soft p-4 text-sm leading-relaxed dark:border-dark-border dark:bg-dark-accentSurface">Local accounts can sign in immediately. Email verification is disabled for local testing.</p>}
                <Button type="submit" isLoading={busy} className="min-h-12 w-full">{heading}</Button>
              </form>
              <Button variant="ghost" disabled={busy} onClick={() => { setSigningIn(!signingIn); setFeedback(undefined); }}>
                {signingIn ? "Create an account" : "Already have an account? Sign in"}
              </Button>
            </>
          )}
          {feedback && <p role={feedback.error ? "alert" : "status"} className="text-sm">{feedback.text}</p>}
        </section>
      </main>
    </div>
  );
}
