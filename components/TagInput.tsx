import { useState } from 'react';
import { View } from 'react-native';
import { Button, Chip, Input } from 'heroui-native';
import { Plus, X } from 'lucide-react-native';

export function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState('');
  const addTag = () => {
    const tag = draft.trim().replace(/^#/, '');
    if (!tag) return;
    if (!value.some((item) => item.toLowerCase() === tag.toLowerCase())) onChange([...value, tag]);
    setDraft('');
  };
  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-2">
        <Input
          className="flex-1"
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={addTag}
          placeholder={placeholder}
          returnKeyType="done"
        />
        <Button isIconOnly variant="secondary" onPress={addTag} accessibilityLabel="Add tag">
          <Plus size={18} />
        </Button>
      </View>
      {value.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {value.map((tag) => (
            <Chip key={tag} variant="secondary">
              <Chip.Label>{tag}</Chip.Label>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                onPress={() => onChange(value.filter((item) => item !== tag))}
                accessibilityLabel={`Remove ${tag}`}
              >
                <X size={14} />
              </Button>
            </Chip>
          ))}
        </View>
      ) : null}
    </View>
  );
}
