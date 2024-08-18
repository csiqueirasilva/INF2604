import DisciplineCard from "@components/DisciplineCard";
import MyLink from "@components/MyLink";
import MyText from "@components/MyText";

export default function HomeScreen() {
    return (
        <DisciplineCard
            title="INF2604"
            description="Geometria Computacional"
        >
            <MyLink href={'/conceitos-basicos/grandezas1'}>
                Conceitos básicos - Grandezas 1
            </MyLink>
        </DisciplineCard>
    )
}