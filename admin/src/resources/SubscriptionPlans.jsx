import {
  List, Datagrid, TextField, NumberField, BooleanField, DateField,
  Edit, Create, SimpleForm, TextInput, NumberInput, BooleanInput,
  Show, SimpleShowLayout, ArrayInput, SimpleFormIterator, ArrayField, SingleFieldList, ChipField,
  required,
} from "react-admin";

export const PlanList = () => (
  <List sort={{ field: "id", order: "ASC" }}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField    source="id"           label="ID" />
      <TextField    source="name"         label="Name" />
      <NumberField  source="price"        label="Price ($)" />
      <NumberField  source="duration_days" label="Duration (days)" />
      <BooleanField source="is_active"    label="Active" />
      <BooleanField source="is_featured"  label="Featured" />
      <DateField    source="updated_at"   label="Last Updated" showTime />
    </Datagrid>
  </List>
);

const PlanFields = () => (
  <>
    <TextInput    source="name"          validate={required()} fullWidth />
    <TextInput    source="description"   multiline rows={3} fullWidth />
    <NumberInput  source="price"         label="Price ($)" />
    <NumberInput  source="duration_days" label="Duration (days)" helperText="Leave blank for a plan that never expires" />
    <ArrayInput   source="features"      label="Features (one per row)">
      <SimpleFormIterator inline>
        <TextInput source="" label="Feature" helperText={false} />
      </SimpleFormIterator>
    </ArrayInput>
    <BooleanInput source="is_active"     label="Active (visible to students)" defaultValue={true} />
    <BooleanInput source="is_featured"   label="Featured (highlighted on pricing page)" />
  </>
);

export const PlanEdit = () => (
  <Edit>
    <SimpleForm>
      <PlanFields />
    </SimpleForm>
  </Edit>
);

export const PlanCreate = () => (
  <Create>
    <SimpleForm>
      <PlanFields />
    </SimpleForm>
  </Create>
);

export const PlanShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField    source="id" />
      <TextField    source="name" />
      <TextField    source="description" />
      <NumberField  source="price" label="Price ($)" />
      <NumberField  source="duration_days" label="Duration (days)" />
      <ArrayField   source="features">
        <SingleFieldList linkType={false}>
          <ChipField source="" />
        </SingleFieldList>
      </ArrayField>
      <BooleanField source="is_active" />
      <BooleanField source="is_featured" />
      <DateField    source="created_at" showTime />
      <DateField    source="updated_at" showTime />
    </SimpleShowLayout>
  </Show>
);
