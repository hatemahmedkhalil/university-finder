import {
  List, Datagrid, TextField, BooleanField, NumberField, DateField, EmailField,
  Show, SimpleShowLayout, SearchInput, SelectInput,
} from "react-admin";

const filters = [
  <SearchInput key="search" source="search" alwaysOn placeholder="Search email" />,
  <SelectInput key="has_profile" source="has_profile" label="Has Profile" choices={[
    { id: "true", name: "Yes" }, { id: "false", name: "No" },
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
      <NumberField  source="gpa" label="GPA" />
      <NumberField  source="budget_eur" label="Budget (€/yr)" />
      <TextField    source="english_level" label="English Level" />
      <TextField    source="field_of_study" label="Field of Study" />
      <TextField    source="preferred_countries" label="Preferred Countries" />
      <DateField    source="created_at" label="Joined" showTime />
    </SimpleShowLayout>
  </Show>
);
