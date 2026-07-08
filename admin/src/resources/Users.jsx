import {
  List, Datagrid, TextField, BooleanField, DateField, EmailField,
  Show, SimpleShowLayout, Edit, SimpleForm, SelectInput, BooleanInput,
  SearchInput, useNotify, useRefresh, useRecordContext, Button,
} from "react-admin";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import axios from "axios";

const userFilters = [
  <SearchInput key="search" source="search" alwaysOn placeholder="Search email" />,
  <SelectInput key="role" source="role" choices={[
    { id: "student", name: "Student" },
    { id: "admin",   name: "Admin" },
  ]} />,
  <SelectInput key="plan" source="plan" choices={[
    { id: "free",    name: "Free" },
    { id: "pro",     name: "Pro" },
    { id: "premium", name: "Premium" },
  ]} />,
];

const ToggleActiveButton = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  if (!record) return null;

  const toggle = async () => {
    try {
      await axios.patch(`/admin/users/${record.id}`, { is_active: !record.is_active }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      });
      notify(record.is_active ? "User deactivated" : "User activated", { type: "success" });
      refresh();
    } catch {
      notify("Failed to update user", { type: "error" });
    }
  };

  return (
    <Button
      label={record.is_active ? "Deactivate" : "Activate"}
      onClick={toggle}
      startIcon={record.is_active ? <BlockIcon /> : <CheckCircleIcon />}
      color={record.is_active ? "error" : "success"}
      size="small"
    />
  );
};

export const UserList = () => (
  <List filters={userFilters} perPage={25} resource="admin/users">
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField    source="id" />
      <EmailField   source="email" />
      <TextField    source="role" />
      <TextField    source="plan" />
      <BooleanField source="is_active"   label="Active" />
      <BooleanField source="is_verified" label="Verified" />
      <DateField    source="created_at"  label="Registered" showTime />
      <ToggleActiveButton />
    </Datagrid>
  </List>
);

export const UserEdit = () => (
  <Edit resource="admin/users">
    <SimpleForm>
      <SelectInput source="role" choices={[
        { id: "student", name: "Student" },
        { id: "admin",   name: "Admin" },
      ]} />
      <SelectInput source="plan" choices={[
        { id: "free",    name: "Free" },
        { id: "pro",     name: "Pro" },
        { id: "premium", name: "Premium" },
      ]} />
      <BooleanInput source="is_active" label="Active" />
    </SimpleForm>
  </Edit>
);

export const UserShow = () => (
  <Show resource="admin/users">
    <SimpleShowLayout>
      <TextField    source="id" />
      <EmailField   source="email" />
      <TextField    source="role" />
      <TextField    source="plan" />
      <BooleanField source="is_active" />
      <BooleanField source="is_verified" />
      <DateField    source="created_at" showTime />
    </SimpleShowLayout>
  </Show>
);
