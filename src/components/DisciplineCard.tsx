import React, { ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { Card, Title, Paragraph, Divider } from 'react-native-paper';

interface DisciplineCardProps {
  title: string;
  description: string;
  children: ReactNode;
}

const DisciplineCard: React.FC<DisciplineCardProps> = ({ title, description, children }) => {
  return (
    <ScrollView className={`p-4`}>
      <Card className={`my-4 p-4 rounded-lg bg-gray-100 shadow-lg`}>
        <Card.Content>
          <Title className={`text-lg font-bold text-purple-700`}>{title}</Title>
          <Paragraph className={`text-base text-gray-700 mb-1`}>{description}</Paragraph>
          <Divider className={`my-2 bg-purple-700`} />
          {children}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

export default DisciplineCard;