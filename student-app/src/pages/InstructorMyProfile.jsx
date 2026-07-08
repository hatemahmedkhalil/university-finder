import { useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

const LANG_GRAD = {
  english: "from-rose-500 via-pink-500 to-fuchsia-600",
  german:  "from-amber-500 via-orange-500 to-red-500",
  polish:  "from-emerald-500 via-teal-500 to-cyan-600",
};

const Avatar = ({ name, photoUrl, grad }) => {
  const [err, setErr] = useState(false);
  const initials = name?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  if (photoUrl && !err) {
    const src = photoUrl.startsWith("http") ? photoUrl : photoUrl;
    return (
      <img src={src} alt={name} onError={() => setErr(true)}
        className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white" />
    );
  }
  return (
    <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white text-3xl font-bold ring-4 ring-white`}>
      {initials}
    </div>
  );
};

const Field = ({ label, value, onChange, type = "text", rows, placeholder }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-semibold text-[oklch(0.75_0.02_285)]">{label}</label>
    {rows ? (
      <textarea
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full border border-[oklch(1_0_0/0.08)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
      />
    ) : (
      <input
        type={type}
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-[oklch(1_0_0/0.08)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
    )}
  </div>
);

const InstructorMyProfile = () => {
  const [profile, setProfile] = useState(null);
  const [form, setForm]       = useState({});
  const [saving, setSaving]   = useState(false);
  const [loading, setLoading] = useState(true);
  const [photoFile, setPhotoFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.get("/instructor-messages/profile")
      .then(r => { setProfile(r.data); setForm(r.data); })
      .catch(() => toast.error("Could not load your profile"))
      .finally(() => setLoading(false));
  }, []);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/instructors/${profile.id}`, {
        name: form.name,
        language: profile.language,
        title: form.title,
        organization: form.organization,
        bio: form.bio,
        specialty: form.specialty,
        email: form.email,
        years_experience: form.years_experience ? Number(form.years_experience) : null,
        is_published: true,
      });
      toast.success("Profile updated!");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to save");
    }
    setSaving(false);
  };

  const uploadPhoto = async () => {
    if (!photoFile) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", photoFile);
    try {
      const r = await api.post(`/instructors/${profile.id}/photo`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfile(p => ({ ...p, photo_url: r.data.photo_url }));
      setForm(f => ({ ...f, photo_url: r.data.photo_url }));
      setPhotoFile(null);
      toast.success("Photo updated!");
    } catch {
      toast.error("Photo upload failed");
    }
    setUploading(false);
  };

  const grad = LANG_GRAD[profile?.language] || "from-indigo-500 to-violet-600";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className={`w-10 h-10 border-4 border-t-transparent rounded-full animate-spin`}
          style={{ borderColor: "rgb(99,102,241)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!profile?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">👤</div>
          <p className="text-[oklch(0.65_0.02_285)] font-semibold">No instructor profile linked to your account.</p>
          <p className="text-[oklch(0.45_0.02_285)] text-sm mt-1">Contact an admin to set up your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">

      {/* Hero */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${grad} text-white`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative max-w-3xl mx-auto px-6 py-10">
          <div className="flex items-end gap-5">
            <Avatar name={form.name} photoUrl={form.photo_url} grad={grad} />
            <div className="pb-1">
              <p className="text-white/70 text-sm capitalize">{profile.language} Instructor</p>
              <h1 className="text-3xl font-extrabold">{form.name || "Your Name"}</h1>
              {form.organization && <p className="text-white/70 text-sm mt-0.5">🏛️ {form.organization}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* Photo upload */}
        <div className="bg-[oklch(0.17_0.02_285)] rounded-2xl border border-[oklch(1_0_0/0.07)] p-6 flex items-center gap-4">
          <Avatar name={form.name} photoUrl={form.photo_url} grad={grad} />
          <div className="flex-1">
            <p className="font-semibold text-[oklch(0.75_0.02_285)] text-sm mb-2">Profile Photo</p>
            <input
              type="file" accept="image/jpeg,image/png,image/webp"
              onChange={e => setPhotoFile(e.target.files[0])}
              className="text-sm text-[oklch(0.55_0.02_285)] file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
            />
            {photoFile && (
              <button
                onClick={uploadPhoto}
                disabled={uploading}
                className={`mt-2 text-xs font-bold px-4 py-1.5 rounded-lg bg-gradient-to-r ${grad} text-white disabled:opacity-50 transition`}
              >
                {uploading ? "Uploading…" : "Upload Photo"}
              </button>
            )}
          </div>
        </div>

        {/* Info fields */}
        <div className="bg-[oklch(0.17_0.02_285)] rounded-2xl border border-[oklch(1_0_0/0.07)] p-6 space-y-5">
          <h2 className="font-bold text-white text-base">Basic Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name"     value={form.name}         onChange={v => set("name", v)}         placeholder="Dr. Mohamed Arafa" />
            <Field label="Title / Prefix" value={form.title}        onChange={v => set("title", v)}        placeholder="Mr. / Dr. / Prof." />
            <Field label="Organization"  value={form.organization}  onChange={v => set("organization", v)} placeholder="University / Institute" />
            <Field label="Contact Email" value={form.email}         onChange={v => set("email", v)}        type="email" placeholder="your@email.com" />
            <Field label="Years of Experience" value={form.years_experience} onChange={v => set("years_experience", v)} type="number" placeholder="e.g. 10" />
          </div>
          <Field
            label="Specialties (comma separated)"
            value={form.specialty}
            onChange={v => set("specialty", v)}
            placeholder="Grammar, Speaking, Business German, IELTS Prep"
          />
          <Field
            label="Bio / About You"
            value={form.bio}
            onChange={v => set("bio", v)}
            rows={5}
            placeholder="Tell students about your background, teaching style, and experience…"
          />
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            onClick={save}
            disabled={saving}
            className={`px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r ${grad} hover:opacity-90 disabled:opacity-50 transition`}
          >
            {saving ? "Saving…" : "💾 Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstructorMyProfile;

