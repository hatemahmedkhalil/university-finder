import { useState } from "react";
import {
  List, Datagrid, TextField, BooleanField, NumberField, DateField, EmailField,
  Edit, Create, SimpleForm, TextInput, BooleanInput, SelectInput, NumberInput,
  Show, SimpleShowLayout, required, useRecordContext, useNotify, useRefresh,
} from "react-admin";
import axios from "axios";

const LANGUAGE_CHOICES = [
  { id: "english", name: "🇬🇧 English" },
  { id: "german",  name: "🇩🇪 German"  },
  { id: "polish",  name: "🇵🇱 Polish"  },
];

const TITLE_CHOICES = [
  { id: "Dr.",   name: "Dr."   },
  { id: "Prof.", name: "Prof." },
  { id: "Mr.",   name: "Mr."   },
  { id: "Ms.",   name: "Ms."   },
  { id: "Mrs.",  name: "Mrs."  },
];

/* ── Photo upload + preview widget (used inside Edit only) ── */
const PhotoUpload = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(record?.photo_url || null);

  if (!record) return null;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview
    setPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      await axios.post(
        `/instructors/${record.id}/upload-photo`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      notify("Photo uploaded successfully!", { type: "success" });
      refresh();
    } catch {
      notify("Failed to upload photo.", { type: "error" });
    }
    setUploading(false);
  };

  const photoSrc = preview
    ? preview.startsWith("blob:") ? preview : `http://localhost:8000${preview}`
    : null;

  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 8, fontWeight: 600 }}>
        INSTRUCTOR PHOTO
      </p>

      {/* Current photo */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
        {photoSrc ? (
          <img
            src={photoSrc}
            alt="Instructor"
            style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: "2px solid #e5e7eb" }}
          />
        ) : (
          <div style={{
            width: 80, height: 80, borderRadius: "50%", background: "#e0e7ff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, color: "#6366f1", border: "2px solid #e5e7eb",
          }}>
            👤
          </div>
        )}

        <div>
          <label style={{
            display: "inline-block", cursor: "pointer",
            background: uploading ? "#a5b4fc" : "#4f46e5",
            color: "#fff", padding: "8px 16px", borderRadius: 8,
            fontSize: 13, fontWeight: 600,
          }}>
            {uploading ? "Uploading…" : "📷 Upload Photo"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFile}
              disabled={uploading}
              style={{ display: "none" }}
            />
          </label>
          <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
            JPG, PNG, WebP or GIF · Max 5MB
          </p>
        </div>
      </div>
    </div>
  );
};

/* ── Photo avatar in the list ── */
const PhotoField = () => {
  const record = useRecordContext();
  if (!record) return null;
  const src = record.photo_url
    ? record.photo_url.startsWith("http") ? record.photo_url : `http://localhost:8000${record.photo_url}`
    : null;
  return src ? (
    <img src={src} alt={record.name} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
  ) : (
    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>👤</div>
  );
};
PhotoField.defaultProps = { label: "Photo" };

export const InstructorList = () => (
  <List sort={{ field: "language", order: "ASC" }}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <PhotoField />
      <TextField    source="id"               label="ID" />
      <TextField    source="title"            label="Title" />
      <TextField    source="name"             label="Name" />
      <TextField    source="language"         label="Language" />
      <TextField    source="organization"     label="Organization" />
      <NumberField  source="years_experience" label="Exp. (yrs)" />
      <BooleanField source="is_published"     label="Published" />
      <DateField    source="created_at"       label="Created" showTime />
    </Datagrid>
  </List>
);

export const InstructorEdit = () => (
  <Edit>
    <SimpleForm>
      <PhotoUpload />
      <SelectInput  source="title"            choices={TITLE_CHOICES} />
      <TextInput    source="name"             validate={required()} fullWidth />
      <SelectInput  source="language"         choices={LANGUAGE_CHOICES} validate={required()} />
      <TextInput    source="specialty"        label="Specialties (comma-separated)" fullWidth />
      <TextInput    source="organization"     label="Organization / Institution" fullWidth />
      <NumberInput  source="years_experience" label="Years of Experience" />
      <TextInput    source="email"            label="Contact Email" fullWidth />
      <TextInput    source="bio"              multiline rows={4} fullWidth />
      <BooleanInput source="is_published"     label="Published (visible to students)" />
      <NumberInput  source="user_id"          label="Linked User ID (for instructor login)" helperText="Enter the User ID of the account this instructor will log in with" />
    </SimpleForm>
  </Edit>
);

export const InstructorCreate = () => (
  <Create>
    <SimpleForm>
      <SelectInput  source="title"            choices={TITLE_CHOICES} />
      <TextInput    source="name"             validate={required()} fullWidth />
      <SelectInput  source="language"         choices={LANGUAGE_CHOICES} validate={required()} />
      <TextInput    source="specialty"        label="Specialties (comma-separated, e.g. IELTS Prep, Business English)" fullWidth />
      <TextInput    source="organization"     label="Organization / Institution (e.g. British Council)" fullWidth />
      <NumberInput  source="years_experience" label="Years of Experience" />
      <TextInput    source="email"            label="Contact Email" fullWidth />
      <TextInput    source="bio"              multiline rows={4} fullWidth />
      <BooleanInput source="is_published"     label="Published (visible to students)" defaultValue={true} />
      <p style={{ fontSize: 12, color: "#6b7280" }}>
        💡 After creating the instructor, open it to upload a photo.
      </p>
    </SimpleForm>
  </Create>
);

export const InstructorShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField    source="id" />
      <NumberField  source="user_id"          label="Linked User ID" />
      <TextField    source="title" />
      <TextField    source="name" />
      <TextField    source="language" />
      <TextField    source="specialty" />
      <TextField    source="organization" />
      <NumberField  source="years_experience" label="Years of Experience" />
      <EmailField   source="email" />
      <TextField    source="photo_url"        label="Photo URL" />
      <TextField    source="bio" />
      <BooleanField source="is_published" />
      <DateField    source="created_at" showTime />
    </SimpleShowLayout>
  </Show>
);
