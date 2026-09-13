import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import {
  Button,
  Card,
  Description,
  FieldError,
  Input,
  Label,
  TextArea,
  TextField,
  Typography,
} from 'heroui-native';
import { Check } from 'lucide-react-native';
import { TagInput } from '@/components/TagInput';
import type { Availability, ParticipantIdentity, ProfileValues } from '@/lib/hackmatch.types';
const EMPTY: ProfileValues = {
  skills_have: [],
  skills_want: [],
  interests: [],
  bio: '',
  roles_wanted: [],
  availability: 'full_hackathon',
  group_id: null,
};
const ROLES = ['Frontend', 'Backend', 'Design', 'PM', 'Data/ML'];
const AVAIL: { value: Availability; label: string }[] = [
  { value: 'full_hackathon', label: 'Full hackathon' },
  { value: 'partial', label: 'Partial' },
  { value: 'remote_only', label: 'Remote only' },
];
export function ProfileForm({
  identity,
  initialValues,
  submitLabel,
  isSubmitting,
  submitError,
  onSubmit,
}: {
  identity: ParticipantIdentity;
  initialValues?: ProfileValues;
  submitLabel: string;
  isSubmitting: boolean;
  submitError?: string | null;
  onSubmit: (v: ProfileValues) => Promise<void> | void;
}) {
  const [values, setValues] = useState(initialValues ?? EMPTY);
  const [validate, setValidate] = useState(false);
  const invalid =
    !values.skills_have.length ||
    !values.skills_want.length ||
    !values.interests.length ||
    values.bio.trim().length < 20;
  const submit = () => {
    setValidate(true);
    if (!invalid) void onSubmit({ ...values, bio: values.bio.trim() });
  };
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View className="gap-6">
        <Card className="gap-4 p-5">
          <Typography.Heading>Your registration</Typography.Heading>
          <View className="gap-4 sm:flex-row">
            <TextField isDisabled className="flex-1">
              <Label>Name</Label>
              <Input value={identity.name} editable={false} />
            </TextField>
            <TextField isDisabled className="flex-1">
              <Label>Email</Label>
              <Input value={identity.email} editable={false} />
            </TextField>
          </View>
        </Card>
        <Card className="gap-7 p-5">
          <TextField isRequired isInvalid={validate && !values.skills_have.length}>
            <Label>Skills you bring</Label>
            <TagInput
              value={values.skills_have}
              onChange={(skills_have) => setValues({ ...values, skills_have })}
              placeholder="Type a skill"
            />
            <FieldError>Add at least one skill.</FieldError>
          </TextField>
          <TextField isRequired isInvalid={validate && !values.skills_want.length}>
            <Label>Skills you want</Label>
            <TagInput
              value={values.skills_want}
              onChange={(skills_want) => setValues({ ...values, skills_want })}
              placeholder="Type a skill"
            />
            <FieldError>Add at least one skill.</FieldError>
          </TextField>
          <TextField isRequired isInvalid={validate && !values.interests.length}>
            <Label>Interests</Label>
            <TagInput
              value={values.interests}
              onChange={(interests) => setValues({ ...values, interests })}
              placeholder="Type an interest"
            />
            <FieldError>Add at least one interest.</FieldError>
          </TextField>
          <TextField isRequired isInvalid={validate && values.bio.trim().length < 20}>
            <Label>About you</Label>
            <TextArea
              value={values.bio}
              onChangeText={(bio) => setValues({ ...values, bio })}
              placeholder="What would you like to build?"
            />
            <Description>Write at least 20 characters.</Description>
            <FieldError>Add a little more detail.</FieldError>
          </TextField>
          <View className="gap-3">
            <Label>Roles you want to find</Label>
            <View className="flex-row flex-wrap gap-2">
              {ROLES.map((r) => {
                const selected = values.roles_wanted.includes(r);
                return (
                  <Button
                    key={r}
                    size="sm"
                    variant={selected ? 'primary' : 'secondary'}
                    onPress={() =>
                      setValues({
                        ...values,
                        roles_wanted: selected
                          ? values.roles_wanted.filter((x) => x !== r)
                          : [...values.roles_wanted, r],
                      })
                    }
                  >
                    {selected ? <Check size={15} /> : null}
                    <Button.Label>{r}</Button.Label>
                  </Button>
                );
              })}
            </View>
          </View>
          <View className="gap-3">
            <Label>Availability</Label>
            <View className="gap-2 sm:flex-row">
              {AVAIL.map((a) => (
                <Button
                  key={a.value}
                  className="flex-1"
                  variant={values.availability === a.value ? 'primary' : 'secondary'}
                  onPress={() => setValues({ ...values, availability: a.value })}
                >
                  <Button.Label>{a.label}</Button.Label>
                </Button>
              ))}
            </View>
          </View>
          {submitError ? <Typography className="text-danger">{submitError}</Typography> : null}
          <Button size="lg" isDisabled={isSubmitting} onPress={submit}>
            <Button.Label>{isSubmitting ? 'Saving…' : submitLabel}</Button.Label>
          </Button>
        </Card>
      </View>
    </KeyboardAvoidingView>
  );
}
