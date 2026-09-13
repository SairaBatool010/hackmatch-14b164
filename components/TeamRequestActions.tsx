import { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, TextArea, Typography } from 'heroui-native';
import { Check, MessageSquareText, Send } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { sendTeamInvite } from '@/lib/hackmatch.api';
import { useHackmatchStore } from '@/lib/hackmatch.store';
import type { TeamRequest } from '@/lib/hackmatch.types';
import { requestThreadHref } from '@/lib/navigation';

const NOTE_LIMIT = 150;

export function TeamRequestActions({
  recipientId,
  recipientName,
  onSent,
}: {
  recipientId: string;
  recipientName: string;
  onSent?: (request: TeamRequest) => void;
}) {
  const router = useRouter();
  const identity = useHackmatchStore((state) => state.identity);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (message: string | null) => {
    if (!identity || sending) return;
    setSending(true);
    setError(null);
    try {
      const request = await sendTeamInvite(identity, recipientId, message);
      setSent(true);
      onSent?.(request);
      if (request.id) router.push(requestThreadHref(request.id, recipientName));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The request could not be sent.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <Button variant="secondary" isDisabled>
        <Check size={16} />
        <Button.Label>Request sent</Button.Label>
      </Button>
    );
  }

  return (
    <View className="gap-3">
      <View className="gap-2 sm:flex-row">
        <Button className="flex-1" isDisabled={sending} onPress={() => void send(null)}>
          <Send size={16} />
          <Button.Label>Send request</Button.Label>
        </Button>
        <Button
          className="flex-1"
          variant="secondary"
          isDisabled={sending}
          onPress={() => setShowNote((visible) => !visible)}
        >
          <MessageSquareText size={16} />
          <Button.Label>Send request with note</Button.Label>
        </Button>
      </View>
      {showNote ? (
        <Card className="gap-2 p-3">
          <TextArea
            value={note}
            onChangeText={(value) => setNote(value.slice(0, NOTE_LIMIT))}
            maxLength={NOTE_LIMIT}
            placeholder={`Write a note to ${recipientName}`}
          />
          <Typography className="text-right text-xs" color="muted">
            {note.length}/{NOTE_LIMIT}
          </Typography>
          <Button isDisabled={!note.trim() || sending} onPress={() => void send(note.trim())}>
            <Button.Label>{sending ? 'Sending…' : 'Send with note'}</Button.Label>
          </Button>
        </Card>
      ) : null}
      {error ? <Typography className="text-danger">{error}</Typography> : null}
    </View>
  );
}
