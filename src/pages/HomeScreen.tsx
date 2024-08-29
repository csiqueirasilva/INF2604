import DisciplineCard from "@components/DisciplineCard";
import MyLink from "@components/MyLink";
import MyText from "@components/MyText";
import GrandezasEscalarVetor from "@pages/conceitos-basicos/GrandezasEscalarVetor";
import GrandezasProdutoVetorial from "@pages/conceitos-basicos/GrandezasProdutoVetorial";
import GrandezasSomaVetores from "@pages/conceitos-basicos/GrandezasSomaVetores";
import GrandezasSubtracaoDeVetores from "@pages/conceitos-basicos/GrandezasSubtracaoDeVetores";
import CirculoMinimo from "@pages/exercicios/CirculoMinimo";
import NuvemDePontosAleatoria from "@pages/exercicios/NuvemDePontosAleatoria";
import PontosMaisProximos from "@pages/exercicios/PontosMaisProximos";
import { Divider, Paragraph, Title } from "react-native-paper";

interface RouteEntry {
    url: string
    component: React.FC
    title: string
}

interface RouteSection {
    title: string
    entries: RouteEntry[]
}

const routesHelper: RouteSection[] = [{
    title: 'Conceitos Básicos',
    entries: [
        {
            component: GrandezasSomaVetores,
            title: 'Soma de Vetores',
            url: '/conceitos-basicos/grandezas-addvetor'
        },
        {
            component: GrandezasSubtracaoDeVetores,
            title: 'Subração de Vetores',
            url: '/conceitos-basicos/grandezas-subvetor'
        },
        {
            component: GrandezasEscalarVetor,
            title: 'Multiplicar vetor por número escalar',
            url: '/conceitos-basicos/grandezas-escalarvetor'
        },
        {
            component: GrandezasProdutoVetorial,
            title: 'Produto vetorial entre vetores',
            url: '/conceitos-basicos/grandezas-dotproduct'
        },
    ]
},
{
    title: 'Exercícios',
    entries: [
        {
            component: NuvemDePontosAleatoria,
            title: 'Nuvem de pontos - aleatória',
            url: '/exercicios/nuvem-aleatoria'
        },
        {
            component: PontosMaisProximos,
            title: 'Nuvem de pontos - pontos mais/menos próximos',
            url: '/exercicios/pontos-mais-proximos'
        },
        {
            component: CirculoMinimo,
            title: 'Círculo mínimo',
            url: '/exercicios/circulo-minimo'
        }
    ]
}]

export { routesHelper }

export default function HomeScreen() {
    return (
        <DisciplineCard
            title="INF2604"
            description="Geometria Computacional"
        >
            {
                routesHelper.map(section => (
                    <div key={section.title}>
                        <Title className={`text-base text-gray-700 mb-1`}>{section.title}</Title>
                        {section.entries.map(entry => (
                            <Paragraph key={entry.url} className="my-1 block">
                                <MyLink href={entry.url}>{entry.title}</MyLink>
                            </Paragraph>
                        ))}
                        <Divider className={`my-2 bg-purple-700`} />
                    </div>
                ))
            }
        </DisciplineCard>
    )
}