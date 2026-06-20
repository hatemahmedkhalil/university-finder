import {
  List,
  Datagrid,
  TextField,
  BooleanField,
  DateField,
  Show,
  SimpleShowLayout,
  SelectInput,
  SearchInput,
} from "react-admin";

const userFilters = [
  <SearchInput source="search" alwaysOn placeholder="Search email" />,
  <SelectInput
    source="role"
    choices={[
      { id: "student", name: "Student" },
      { id: "admin", name: "Admin" },
    ]}
  />,
];

export const UserList = () => (
  <List filters={userFilters} perPage={25}>
    <Datagrid rowClick="show" bulkActionButtons={false}>
      <TextField source="id" />
      <TextField source="email" />
      <TextField source="role" />
      <BooleanField source="is_active" label="Active" />
      <DateField source="created_at" label="Registered" showTime />
    </Datagrid>
  </List>
);

export const UserShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="email" />
      <TextField source="role" />
      <BooleanField source="is_active" />
      <DateField source="created_at" showTime />
    </SimpleShowLayout>
  </Show>
);
