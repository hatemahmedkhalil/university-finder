import {
  List, Datagrid, TextField, BooleanField, NumberField, DateField,
  Edit, Create, SimpleForm, TextInput, BooleanInput, SelectInput,
  Show, SimpleShowLayout, required, useRecordContext,
} from "react-admin";

const LANGUAGE_CHOICES = [
  { id: "english", name: "🇬🇧 English" },
  { id: "german",  name: "🇩🇪 German"  },
  { id: "polish",  name: "🇵🇱 Polish"  },
];

const LEVEL_CHOICES = [
  { id: "A1", name: "A1 — Beginner" },
  { id: "A2", name: "A2 — Elementary" },
  { id: "B1", name: "B1 — Intermediate" },
  { id: "B2", name: "B2 — Upper-Intermediate" },
  { id: "C1", name: "C1 — Advanced" },
  { id: "C2", name: "C2 — Proficiency" },
];

/* ── Placement Tests ── */

export const PlacementTestList = () => (
  <List sort={{ field: "language", order: "ASC" }}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField      source="id"            label="ID" />
      <TextField      source="title"         label="Title" />
      <TextField      source="language"      label="Language" />
      <NumberField    source="question_count" label="Questions" />
      <BooleanField   source="is_published"  label="Published" />
      <DateField      source="created_at"    label="Created" showTime />
    </Datagrid>
  </List>
);

export const PlacementTestEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="title"       validate={required()} fullWidth />
      <SelectInput source="language"  choices={LANGUAGE_CHOICES} validate={required()} />
      <TextInput source="description" multiline rows={3} fullWidth />
      <BooleanInput source="is_published" label="Published (visible to students)" />
    </SimpleForm>
  </Edit>
);

export const PlacementTestCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="title"       validate={required()} fullWidth />
      <SelectInput source="language"  choices={LANGUAGE_CHOICES} validate={required()} />
      <TextInput source="description" multiline rows={3} fullWidth />
      <BooleanInput source="is_published" label="Published (visible to students)" />
    </SimpleForm>
  </Create>
);

export const PlacementTestShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField   source="id" />
      <TextField   source="title" />
      <TextField   source="language" />
      <TextField   source="description" />
      <NumberField source="question_count" label="Total Questions" />
      <BooleanField source="is_published" />
      <DateField   source="created_at" showTime />
    </SimpleShowLayout>
  </Show>
);

/* ── Courses ── */

export const CourseList = () => (
  <List sort={{ field: "language", order: "ASC" }}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField    source="id"           label="ID" />
      <TextField    source="title"        label="Title" />
      <TextField    source="language"     label="Language" />
      <TextField    source="level"        label="Level" />
      <NumberField  source="lesson_count" label="Lessons" />
      <BooleanField source="is_published" label="Published" />
      <DateField    source="created_at"   label="Created" showTime />
    </Datagrid>
  </List>
);

export const CourseEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput   source="title"         validate={required()} fullWidth />
      <SelectInput source="language"      choices={LANGUAGE_CHOICES} validate={required()} />
      <SelectInput source="level"         choices={LEVEL_CHOICES} />
      <TextInput   source="description"   multiline rows={3} fullWidth />
      <TextInput   source="thumbnail_url" label="Thumbnail URL" fullWidth />
      <BooleanInput source="is_published" label="Published (visible to students)" />
    </SimpleForm>
  </Edit>
);

export const CourseCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput   source="title"         validate={required()} fullWidth />
      <SelectInput source="language"      choices={LANGUAGE_CHOICES} validate={required()} />
      <SelectInput source="level"         choices={LEVEL_CHOICES} />
      <TextInput   source="description"   multiline rows={3} fullWidth />
      <TextInput   source="thumbnail_url" label="Thumbnail URL" fullWidth />
      <BooleanInput source="is_published" label="Published (visible to students)" />
    </SimpleForm>
  </Create>
);

export const CourseShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField    source="id" />
      <TextField    source="title" />
      <TextField    source="language" />
      <TextField    source="level" />
      <TextField    source="description" />
      <NumberField  source="lesson_count" label="Total Lessons" />
      <TextField    source="thumbnail_url" label="Thumbnail URL" />
      <BooleanField source="is_published" />
      <DateField    source="created_at" showTime />
    </SimpleShowLayout>
  </Show>
);
