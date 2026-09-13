import { useMemo, useState } from 'react';
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
import { DEFAULT_PROFILE_SCHEMA } from '@/lib/hackmatch.api';
import type {
  Availability,
  ParticipantIdentity,
  ProfileAnswer,
  ProfileFormSchema,
  ProfileQuestion,
  ProfileValues,
} from '@/lib/hackmatch.types';

const EMPTY: ProfileValues = {
  skills_have: [],
  skills_want: [],
  interests: [],
  bio: '',
  roles_wanted: [],
  availability: 'full_hackathon',
  group_id: null,
  custom_fields: {},
};
const AVAILABILITY: { value: Availability; fallbackLabel: string }[] = [
  { value: 'full_hackathon', fallbackLabel: 'Full hackathon' },
  { value: 'partial', fallbackLabel: 'Partial' },
  { value: 'remote_only', fallbackLabel: 'Remote only' },
];
const ARRAY_KEYS = ['skills_have', 'skills_want', 'interests', 'roles_wanted'] as const;
type ArrayKey = (typeof ARRAY_KEYS)[number];

function isArrayKey(key: string): key is ArrayKey {
  return ARRAY_KEYS.some((candidate) => candidate === key);
}

function customAnswer(values: ProfileValues, key: string): ProfileAnswer {
  return values.custom_fields?.[key] ?? null;
}

export function ProfileForm({
  identity,
  initialValues,
  schema = DEFAULT_PROFILE_SCHEMA,
  submitLabel,
  isSubmitting,
  submitError,
  onSubmit,
}: {
  identity: ParticipantIdentity;
  initialValues?: ProfileValues;
  schema?: ProfileFormSchema;
  submitLabel: string;
  isSubmitting: boolean;
  submitError?: string | null;
  onSubmit: (values: ProfileValues) => Promise<void> | void;
}) {
  const [values, setValues] = useState<ProfileValues>({
    ...EMPTY,
    ...initialValues,
    custom_fields: initialValues?.custom_fields ?? {},
  });
  const [validate, setValidate] = useState(false);
  const questions = useMemo(
    () => (schema.questions.length ? schema.questions : DEFAULT_PROFILE_SCHEMA.questions),
    [schema.questions],
  );
  const requiredCustomMissing = questions.some((question) => {
    if (!question.required || question.baseline) return false;
    const answer = customAnswer(values, question.key);
    return Array.isArray(answer) ? !answer.length : !answer?.trim();
  });
  const invalid =
    !values.skills_have.length ||
    !values.skills_want.length ||
    !values.interests.length ||
    values.bio.trim().length < 20 ||
    requiredCustomMissing;

  const setCustom = (key: string, answer: ProfileAnswer) => {
    setValues((current) => ({
      ...current,
      custom_fields: { ...current.custom_fields, [key]: answer },
    }));
  };
  const submit = () => {
    setValidate(true);
    if (!invalid) void onSubmit({ ...values, bio: values.bio.trim() });
  };

  const renderQuestion = (question: ProfileQuestion) => {
    if (isArrayKey(question.key)) {
      const selected = values[question.key];
      if (question.key !== 'roles_wanted' || !question.options?.length) {
        return (
          <TextField
            key={question.id}
            isRequired={question.required}
            isInvalid={validate && question.required && !selected.length}
          >
            <Label>{question.label}</Label>
            <TagInput
              value={selected}
              onChange={(next) => setValues((current) => ({ ...current, [question.key]: next }))}
              placeholder="Type an answer"
            />
            <FieldError>Add at least one answer.</FieldError>
          </TextField>
        );
      }
      return (
        <View key={question.id} className="gap-3">
          <Label>{question.label}</Label>
          <View className="flex-row flex-wrap gap-2">
            {question.options.map((option) => {
              const active = selected.includes(option);
              return (
                <Button
                  key={option}
                  size="sm"
                  variant={active ? 'primary' : 'secondary'}
                  onPress={() =>
                    setValues((current) => ({
                      ...current,
                      [question.key]: active
                        ? selected.filter((item) => item !== option)
                        : [...selected, option],
                    }))
                  }
                >
                  {active ? <Check size={15} /> : null}
                  <Button.Label>{option}</Button.Label>
                </Button>
              );
            })}
          </View>
        </View>
      );
    }
    if (question.key === 'bio') {
      return (
        <TextField
          key={question.id}
          isRequired
          isInvalid={validate && values.bio.trim().length < 20}
        >
          <Label>{question.label}</Label>
          <TextArea
            value={values.bio}
            onChangeText={(bio) => setValues((current) => ({ ...current, bio }))}
          />
          <Description>Write at least 20 characters.</Description>
          <FieldError>Add a little more detail.</FieldError>
        </TextField>
      );
    }
    if (question.key === 'availability') {
      return (
        <View key={question.id} className="gap-3">
          <Label>{question.label}</Label>
          <View className="gap-2 sm:flex-row">
            {AVAILABILITY.map((item, index) => (
              <Button
                key={item.value}
                className="flex-1"
                variant={values.availability === item.value ? 'primary' : 'secondary'}
                onPress={() => setValues((current) => ({ ...current, availability: item.value }))}
              >
                <Button.Label>{question.options?.[index] ?? item.fallbackLabel}</Button.Label>
              </Button>
            ))}
          </View>
        </View>
      );
    }

    const answer = customAnswer(values, question.key);
    const missing = question.required && (Array.isArray(answer) ? !answer.length : !answer?.trim());
    if (question.type === 'multi_select') {
      const selected = Array.isArray(answer) ? answer : [];
      return (
        <TextField key={question.id} isRequired={question.required} isInvalid={validate && missing}>
          <Label>{question.label}</Label>
          {question.options?.length ? (
            <View className="flex-row flex-wrap gap-2">
              {question.options.map((option) => {
                const active = selected.includes(option);
                return (
                  <Button
                    key={option}
                    size="sm"
                    variant={active ? 'primary' : 'secondary'}
                    onPress={() =>
                      setCustom(
                        question.key,
                        active ? selected.filter((item) => item !== option) : [...selected, option],
                      )
                    }
                  >
                    {active ? <Check size={15} /> : null}
                    <Button.Label>{option}</Button.Label>
                  </Button>
                );
              })}
            </View>
          ) : (
            <TagInput
              value={selected}
              onChange={(next) => setCustom(question.key, next)}
              placeholder="Type an answer"
            />
          )}
          <FieldError>This question is required.</FieldError>
        </TextField>
      );
    }
    if (question.type === 'single_select') {
      const selected = typeof answer === 'string' ? answer : '';
      return (
        <TextField key={question.id} isRequired={question.required} isInvalid={validate && missing}>
          <Label>{question.label}</Label>
          <View className="flex-row flex-wrap gap-2">
            {(question.options ?? []).map((option) => (
              <Button
                key={option}
                size="sm"
                variant={selected === option ? 'primary' : 'secondary'}
                onPress={() => setCustom(question.key, option)}
              >
                <Button.Label>{option}</Button.Label>
              </Button>
            ))}
          </View>
          <FieldError>This question is required.</FieldError>
        </TextField>
      );
    }
    const text = typeof answer === 'string' ? answer : '';
    return (
      <TextField key={question.id} isRequired={question.required} isInvalid={validate && missing}>
        <Label>{question.label}</Label>
        {question.type === 'long_text' ? (
          <TextArea value={text} onChangeText={(next) => setCustom(question.key, next)} />
        ) : (
          <Input value={text} onChangeText={(next) => setCustom(question.key, next)} />
        )}
        <FieldError>This question is required.</FieldError>
      </TextField>
    );
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
          {questions.map(renderQuestion)}
          {submitError ? <Typography className="text-danger">{submitError}</Typography> : null}
          <Button size="lg" isDisabled={isSubmitting} onPress={submit}>
            <Button.Label>{isSubmitting ? 'Saving…' : submitLabel}</Button.Label>
          </Button>
        </Card>
      </View>
    </KeyboardAvoidingView>
  );
}
