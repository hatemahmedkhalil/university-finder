import {
  List,
  Datagrid,
  TextField,
  NumberField,
  BooleanField,
  Edit,
  Create,
  SimpleForm,
  TextInput,
  NumberInput,
  BooleanInput,
  Show,
  SimpleShowLayout,
  SearchInput,
  SelectInput,
  required,
  minValue,
  maxValue,
} from "react-admin";

const universityFilters = [
  <SearchInput source="search" alwaysOn placeholder="Search name or city" />,
  <SelectInput
    source="country"
    choices={[
      { id: "Germany", name: "Germany" },
      { id: "Poland", name: "Poland" },
      { id: "Austria", name: "Austria" },
      { id: "Netherlands", name: "Netherlands" },
    ]}
  />,
  <SelectInput
    source="english_only"
    label="English Programs"
    choices={[
      { id: true, name: "Yes" },
      { id: false, name: "No" },
    ]}
  />,
];

export const UniversityList = () => (
  <List filters={universityFilters} perPage={25}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="country" />
      <TextField source="city" />
      <NumberField source="ranking" />
      <NumberField source="tuition_fee_eur" label="Tuition (€)" />
      <BooleanField source="is_public" label="Public" />
      <BooleanField source="english_programs_available" label="English Programs" />
    </Datagrid>
  </List>
);

export const UniversityEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" validate={required()} fullWidth />
      <TextInput source="country" validate={required()} />
      <TextInput source="city" validate={required()} />
      <TextInput source="website" fullWidth />
      <TextInput source="description" multiline rows={3} fullWidth />
      <NumberInput source="ranking" label="World Ranking" />
      <NumberInput source="tuition_fee_eur" label="Tuition Fee (€)" />
      <NumberInput
        source="acceptance_rate"
        label="Acceptance Rate (0-1)"
        validate={[minValue(0), maxValue(1)]}
      />
      <BooleanInput source="is_public" label="Public University" />
      <BooleanInput source="english_programs_available" label="English Programs Available" />
    </SimpleForm>
  </Edit>
);

export const UniversityCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" validate={required()} fullWidth />
      <TextInput source="country" validate={required()} />
      <TextInput source="city" validate={required()} />
      <TextInput source="website" fullWidth />
      <TextInput source="description" multiline rows={3} fullWidth />
      <NumberInput source="ranking" label="World Ranking" />
      <NumberInput source="tuition_fee_eur" label="Tuition Fee (€)" />
      <NumberInput
        source="acceptance_rate"
        label="Acceptance Rate (0-1)"
        validate={[minValue(0), maxValue(1)]}
      />
      <BooleanInput source="is_public" label="Public University" defaultValue={true} />
      <BooleanInput source="english_programs_available" label="English Programs Available" />
    </SimpleForm>
  </Create>
);

export const UniversityShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="country" />
      <TextField source="city" />
      <TextField source="website" />
      <TextField source="description" />
      <NumberField source="ranking" />
      <NumberField source="tuition_fee_eur" label="Tuition (€)" />
      <NumberField source="acceptance_rate" />
      <BooleanField source="is_public" />
      <BooleanField source="english_programs_available" />
    </SimpleShowLayout>
  </Show>
);
