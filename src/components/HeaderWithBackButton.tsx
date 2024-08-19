import BackButtonWithTooltip from "@components/BackButtonWithTooltipProps";
import { Appbar } from "react-native-paper";

interface HeaderWithBackButtonProps {
    title: string;
}

export const HEADER_HEIGHT = 60;

const HeaderWithBackButton: React.FC<HeaderWithBackButtonProps> = ({ title }) => {
    return (
      <Appbar.Header style={{ height: HEADER_HEIGHT }} className="bg-blue-600 flex flex-row items-center">
        <BackButtonWithTooltip />
        <Appbar.Content title={title} titleStyle={{ color: 'black' }} />
      </Appbar.Header>
    );
  };
  
  export default HeaderWithBackButton;