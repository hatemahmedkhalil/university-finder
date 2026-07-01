import {
  List, Datagrid, TextField, BooleanField, DateField,
  Edit, Create, SimpleForm, TextInput, BooleanInput, SelectInput,
  Show, SimpleShowLayout, NumberInput, required,
} from "react-admin";

const TYPE_CHOICES = [
  { id: "info",    name: "📢 Info"    },
  { id: "success", name: "✅ Success" },
  { id: "warning", name: "⚠️ Warning" },
];

export const AnnouncementList = () => (
  <List sort={{ field: "created_at", order: "DESC" }}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField    source="id"           label="ID" />
      <TextField    source="title"        label="Title" />
      <TextField    source="type"         label="Type" />
      <BooleanField source="is_published" label="Published" />
      <DateField    source="created_at"   label="Created" showTime />
    </Datagrid>
  </List>
);

export const AnnouncementEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput    source="title"          validate={required()} fullWidth />
      <TextInput    source="body"           multiline rows={4} validate={required()} fullWidth />
      <SelectInput  source="type"           choices={TYPE_CHOICES} validate={required()} />
      <BooleanInput source="is_published"   label="Published (visible to students)" />
      <NumberInput  source="target_user_id" label="Target User ID (leave blank = all users)" helperText="Set a user ID to send this only to that student" />
    </SimpleForm>
  </Edit>
);

export const AnnouncementCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput    source="title"          validate={required()} fullWidth />
      <TextInput    source="body"           multiline rows={4} validate={required()} fullWidth />
      <SelectInput  source="type"           choices={TYPE_CHOICES} validate={required()} defaultValue="info" />
      <BooleanInput source="is_published"   label="Published (visible to students)" defaultValue={true} />
      <NumberInput  source="target_user_id" label="Target User ID (leave blank = all users)" helperText="Set a user ID to send this only to that student" />
    </SimpleForm>
  </Create>
);

export const AnnouncementShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField    source="id" />
      <TextField    source="title" />
      <TextField    source="body" />
      <TextField    source="type" />
      <BooleanField source="is_published" />
      <DateField    source="created_at" showTime />
    </SimpleShowLayout>
  </Show>
);
