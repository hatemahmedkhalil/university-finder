import {
  List, Datagrid, TextField, BooleanField, NumberField, DateField, EmailField,
  Show, SimpleShowLayout, SearchInput, SelectInput,
  Edit, SimpleForm, TextInput, NumberInput,
} from "react-admin";

const filters = [
  <SearchInput key="search" source="search" alwaysOn placeholder="Search email" />,
  <SelectInput key="has_profile" source="has_profile" label="Has Profile" choices={[
    { id: "true", name: "Yes" }, { id: "false", name: "No" },
  ]} />,
  <SelectInput key="degree_level" source="degree_level" label="Degree" choices={[
    { id: "bachelor", name: "Bachelor" },
    { id: "master",   name: "Master" },
    { id: "phd",      name: "PhD" },
  ]} />,
];

export const StudentList = () => (
  <List filters={filters} perPage={25} resource="admin/students" sort={{ field: "id", order: "DESC" }}>
    <Datagrid rowClick="show" bulkActionButtons={false}>
      <TextField    source="id" />
      <EmailField   source="email" />
      <BooleanField source="is_active"   label="Active" />
      <BooleanField source="has_profile" label="Profile" />
      <TextField    source="nationality" />
      <TextField    source="degree_level" label="Degree" />
      <NumberField  source="gpa" />
      <TextField    source="english_level" label="English" />
      <TextField    source="field_of_study" label="Field" />
      <TextField    source="preferred_countries" label="Countries" />
      <DateField    source="created_at" label="Joined" showTime />
    </Datagrid>
  </List>
);

export const StudentShow = () => (
  <Show resource="admin/students">
    <SimpleShowLayout>
      <TextField    source="id" />
      <EmailField   source="email" />
      <BooleanField source="is_active" />
      <BooleanField source="has_profile" label="Has Profile" />
      <TextField    source="nationality" />
      <TextField    source="degree_level" label="Degree Level" />
      <NumberField  source="gpa" label="GPA (Current)" />
      <NumberField  source="budget_eur" label="Budget (€/yr)" />
      <TextField    source="english_level" label="English Level" />
      <TextField    source="field_of_study" label="Field of Study" />
      <TextField    source="preferred_countries" label="Preferred Countries" />
      <DateField    source="created_at" label="Joined" showTime />
      <TextField    source="prev_university" label="Previous University" />
      <TextField    source="prev_country"    label="Previous Country" />
      <TextField    source="prev_major"      label="Previous Major" />
      <NumberField  source="graduation_year" label="Graduation Year" />
      <NumberField  source="prev_gpa"        label="Previous GPA" />
    </SimpleShowLayout>
  </Show>
);

export const StudentEdit = () => (
  <Edit resource="admin/students">
    <SimpleForm>
      <TextInput   source="prev_university" label="Previous University" fullWidth />
      <TextInput   source="prev_country"    label="Previous Country" fullWidth />
      <TextInput   source="prev_major"      label="Previous Major" fullWidth />
      <NumberInput source="graduation_year" label="Graduation Year" />
      <NumberInput source="prev_gpa"        label="Previous GPA (0–4.0)" step={0.01} min={0} max={4} />
    </SimpleForm>
  </Edit>
);
