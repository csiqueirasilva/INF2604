import BackButtonWithTooltip from "@components/BackButtonWithTooltipProps";
import { Appbar } from "react-native-paper";

interface HeaderWithBackButtonProps {
    title: string;
}

const HeaderWithBackButton: React.FC<HeaderWithBackButtonProps> = ({ title }) => {
    return (
      <Appbar.Header className="bg-blue-600 flex flex-row items-center">
        <BackButtonWithTooltip />
        <Appbar.Content title={title} titleStyle={{ color: 'black' }} />
      </Appbar.Header>
    );
  };
  
  export default HeaderWithBackButton;