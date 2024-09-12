import { Card } from '@components/ui/card';
import { Separator } from '@components/ui/separator';
import { H1, H2, H3, P } from '@components/ui/typography';
import React, { ReactNode } from 'react';
import { ScrollView } from 'react-native';

interface DisciplineCardProps {
  title: string;
  description: string;
  children: ReactNode;
}

const DisciplineCard: React.FC<DisciplineCardProps> = ({ title, description, children }) => {
  return (
    <ScrollView className={`p-4`}>
      <Card className={`my-4 p-4 rounded-lg bg-gray-100 shadow-lg`}>
        <H3>{title}</H3>
        <Separator className={`my-2`} />
        <P className={`!my-1`}>{description}</P>
        <Separator className={`my-2`} />
        {children}
      </Card>
    </ScrollView>
  );
};

export default DisciplineCard;