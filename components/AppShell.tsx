import type { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { Typography } from 'heroui-native';

interface AppShellProps extends PropsWithChildren {
  title?: string;
  eyebrow?: string;
  description?: string;
  action?: ReactNode;
  width?: 'narrow' | 'wide';
}
export function AppShell({
  title,
  eyebrow,
  description,
  action,
  width = 'wide',
  children,
}: AppShellProps) {
  return (
    <ScrollView
      className="bg-background flex-1"
      contentContainerClassName="min-h-full px-4 py-8 sm:px-6 lg:px-8"
      keyboardShouldPersistTaps="handled"
    >
      <View className={`mx-auto w-full ${width === 'narrow' ? 'max-w-2xl' : 'max-w-6xl'}`}>
        {title || action ? (
          <View className="mb-7 gap-4 sm:flex-row sm:items-end sm:justify-between">
            <View className="max-w-3xl flex-1">
              {eyebrow ? (
                <Typography.Paragraph className="text-accent mb-2 text-sm font-semibold tracking-wider uppercase">
                  {eyebrow}
                </Typography.Paragraph>
              ) : null}
              {title ? (
                <Typography.Heading className="text-3xl sm:text-4xl">{title}</Typography.Heading>
              ) : null}
              {description ? (
                <Typography.Paragraph color="muted" className="mt-2 text-base leading-6">
                  {description}
                </Typography.Paragraph>
              ) : null}
            </View>
            {action}
          </View>
        ) : null}
        {children}
      </View>
    </ScrollView>
  );
}
