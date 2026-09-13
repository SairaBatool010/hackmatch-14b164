import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { Button, Card, Input, Spinner, Typography } from 'heroui-native';
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Save, Trash2 } from 'lucide-react-native';
import { AppShell } from '@/components/AppShell';
import {
  DEFAULT_PROFILE_SCHEMA,
  getProfileFormSchema,
  saveProfileFormSchema,
} from '@/lib/hackmatch.api';
import { useHackmatchStore } from '@/lib/hackmatch.store';
import type {
  ProfileFormSchema,
  ProfileQuestion,
  ProfileQuestionType,
} from '@/lib/hackmatch.types';
import { goBackOrReplace } from '@/lib/navigation';

const TYPES: { value: ProfileQuestionType; label: string }[] = [
  { value: 'short_text', label: 'Short text' },
  { value: 'long_text', label: 'Long text' },
  { value: 'multi_select', label: 'Multi-select tags' },
  { value: 'single_select', label: 'Single-select' },
];

export default function ProfileSchemaBuilder() {
  const role = useHackmatchStore((state) => state.appRole);
  const identity = useHackmatchStore((state) => state.identity);
  const [schema, setSchema] = useState<ProfileFormSchema>(DEFAULT_PROFILE_SCHEMA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSchema(await getProfileFormSchema(identity));
      setStatus(null);
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : 'The form schema could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [identity]);
  useEffect(() => {
    const initialLoad = setTimeout(() => void load(), 0);
    return () => clearTimeout(initialLoad);
  }, [load]);
  if (role !== 'admin') return <Redirect href="/role" />;

  const update = (id: string, patch: Partial<ProfileQuestion>) =>
    setSchema((current) => ({
      questions: current.questions.map((question) =>
        question.id === id ? { ...question, ...patch } : question,
      ),
    }));
  const move = (index: number, offset: number) =>
    setSchema((current) => {
      const next = [...current.questions];
      const target = index + offset;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return { questions: next };
    });
  const add = () =>
    setSchema((current) => {
      const id = `custom-${Date.now()}`;
      return {
        questions: [
          ...current.questions,
          { id, key: id, label: 'New question', type: 'short_text' },
        ],
      };
    });
  const remove = (id: string) =>
    setSchema((current) => ({
      questions: current.questions.filter((question) => question.id !== id),
    }));
  const save = async () => {
    setSaving(true);
    setStatus(null);
    try {
      setSchema(await saveProfileFormSchema(schema, identity));
      setStatus('Profile questions saved.');
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : 'Questions could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      eyebrow="Admin workspace"
      title="Profile form builder"
      description="Baseline matching fields keep stable IDs. Added questions are stored and displayed, but are not used in recommendation scoring."
    >
      <Button className="mb-5 self-start" variant="ghost" onPress={() => goBackOrReplace('/admin')}>
        <ArrowLeft size={18} />
        <Button.Label>Admin dashboard</Button.Label>
      </Button>
      <Card className="bg-warning-soft mb-5 p-4">
        <Typography>
          Custom questions are not scored by matching. Keep the baseline questions so
          recommendations retain their current quality.
        </Typography>
      </Card>
      {loading ? (
        <Card className="items-center py-10">
          <Spinner />
        </Card>
      ) : (
        <View className="gap-4">
          {schema.questions.map((question, index) => (
            <Card key={question.id} className="gap-4 p-5">
              <View className="flex-row items-center gap-2">
                <Typography className="flex-1 font-semibold">
                  {question.baseline ? 'Matching field' : 'Custom field'}
                </Typography>
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  isDisabled={index === 0}
                  onPress={() => move(index, -1)}
                >
                  <ArrowUp size={16} />
                </Button>
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  isDisabled={index === schema.questions.length - 1}
                  onPress={() => move(index, 1)}
                >
                  <ArrowDown size={16} />
                </Button>
                {!question.baseline ? (
                  <Button isIconOnly size="sm" variant="ghost" onPress={() => remove(question.id)}>
                    <Trash2 size={16} />
                  </Button>
                ) : null}
              </View>
              <Input
                value={question.label}
                onChangeText={(label) => update(question.id, { label })}
                placeholder="Question label"
              />
              <View className="flex-row flex-wrap gap-2">
                {TYPES.map((type) => (
                  <Button
                    key={type.value}
                    size="sm"
                    variant={question.type === type.value ? 'primary' : 'secondary'}
                    isDisabled={question.baseline}
                    onPress={() => update(question.id, { type: type.value })}
                  >
                    <Button.Label>{type.label}</Button.Label>
                  </Button>
                ))}
              </View>
              {question.type === 'single_select' ||
              (question.type === 'multi_select' && question.options) ? (
                <Input
                  value={(question.options ?? []).join(', ')}
                  onChangeText={(text) =>
                    update(question.id, {
                      options: text
                        .split(',')
                        .map((option) => option.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="Options, separated by commas"
                />
              ) : null}
              <Button
                size="sm"
                variant={question.required ? 'primary' : 'secondary'}
                onPress={() => update(question.id, { required: !question.required })}
              >
                <Button.Label>{question.required ? 'Required' : 'Optional'}</Button.Label>
              </Button>
            </Card>
          ))}
          <Button variant="secondary" onPress={add}>
            <Plus size={18} />
            <Button.Label>Add question</Button.Label>
          </Button>
          {status ? (
            <Typography className={status.includes('saved') ? 'text-success' : 'text-danger'}>
              {status}
            </Typography>
          ) : null}
          <Button size="lg" isDisabled={saving} onPress={() => void save()}>
            {saving ? <Spinner size="sm" /> : <Save size={18} />}
            <Button.Label>{saving ? 'Saving…' : 'Save form'}</Button.Label>
          </Button>
        </View>
      )}
    </AppShell>
  );
}
