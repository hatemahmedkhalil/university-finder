import {
  List,
  Datagrid,
  TextField,
  NumberField,
  Edit,
  Create,
  SimpleForm,
  TextInput,
  NumberInput,
  SelectInput,
  Show,
  SimpleShowLayout,
  required,
} from "react-admin";

const typeChoices = [
  { id: "full", name: "Full" },
  { id: "partial", name: "Partial" },
  { id: "merit", name: "Merit" },
  { id: "need_based", name: "Need Based" },
  { id: "government", name: "Government" },
];

const scholarshipFilters = [
  <SelectInput source="scholarship_type" choices={typeChoices} />,
];

export const ScholarshipList = () => (
  <List filters={scholarshipFilters} perPage={25}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="provider" />
      <TextField source="scholarship_type" label="Type" />
      <NumberField source="amount_eur" label="Amount (€)" />
      <TextField source="deadline" />
      <TextField source="university_id" label="University ID" />
    </Datagrid>
  </List>
);

export const ScholarshipEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" validate={required()} fullWidth />
      <TextInput source="provider" validate={required()} fullWidth />
      <SelectInput source="scholarship_type" choices={typeChoices} validate={required()} />
      <NumberInput source="amount_eur" label="Amount (€)" />
      <NumberInput source="university_id" label="University ID (optional)" />
      <TextInput source="description" multiline rows={3} fullWidth />
      <TextInput source="eligibility" multiline rows={2} fullWidth />
      <TextInput source="deadline" placeholder="e.g. 2025-12-31" />
      <TextInput source="link" fullWidth />
    </SimpleForm>
  </Edit>
);

export const ScholarshipCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" validate={required()} fullWidth />
      <TextInput source="provider" validate={required()} fullWidth />
      <SelectInput source="scholarship_type" choices={typeChoices} validate={required()} />
      <NumberInput source="amount_eur" label="Amount (€)" />
      <NumberInput source="university_id" label="University ID (optional)" />
      <TextInput source="description" multiline rows={3} fullWidth />
      <TextInput source="eligibility" multiline rows={2} fullWidth />
      <TextInput source="deadline" placeholder="e.g. 2025-12-31" />
      <TextInput source="link" fullWidth />
    </SimpleForm>
  </Create>
);

export const ScholarshipShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="provider" />
      <TextField source="scholarship_type" />
      <NumberField source="amount_eur" label="Amount (€)" />
      <TextField source="university_id" />
      <TextField source="description" />
      <TextField source="eligibility" />
      <TextField source="deadline" />
      <TextField source="link" />
    </SimpleShowLayout>
  </Show>
);
