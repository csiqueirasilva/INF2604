import { Href } from "expo-router";
import { forwardRef } from "react";
import * as Icons from '@expo/vector-icons';
import MyLink from "@components/MyLink";
import { Text } from 'react-native';

interface Props {
    url: Href<string | object> | string,
}

const BackButton = forwardRef<any, Props>((props, ref) => {
    return (
        <MyLink ref={ref} href={props.url} className='m-[10px]'>
            <Icons.FontAwesome6 name="chevron-left" size={20} />
        </MyLink>
    )
}
)

export default BackButton