import DisciplineCard from "@components/DisciplineCard";
import MyLink from "@components/MyLink";
import { Button } from "@components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger } from "@components/ui/dialog";
import { Separator } from "@components/ui/separator";
import { H3, List, P } from "@components/ui/typography";
import GrandezasEscalarVetor from "@pages/conceitos-basicos/GrandezasEscalarVetor";
import GrandezasProdutoVetorial from "@pages/conceitos-basicos/GrandezasProdutoVetorial";
import GrandezasSomaVetores from "@pages/conceitos-basicos/GrandezasSomaVetores";
import GrandezasSubtracaoDeVetores from "@pages/conceitos-basicos/GrandezasSubtracaoDeVetores";
import CirculoMinimo from "@pages/exercicios/CirculoMinimo";
import DiagramaVoronoiScreen from "@pages/exercicios/DiagramaVoronoi";
import DiagramaVoronoi2dScreen from "@pages/exercicios/DiagramaVoronoi2d";
import FechoConvexoScreen from "@pages/exercicios/FechoConvexoScreen";
import NuvemDePontosAleatoria from "@pages/exercicios/NuvemDePontosAleatoria";
import PontosMaisProximos from "@pages/exercicios/PontosMaisProximos";
import ProjetorBilinear from "@pages/exercicios/ProjetorBilinear";
import RepresentacaoMalhaTriangulos from "@pages/exercicios/RepresentacaoMalhaTriangulos";
import TriangulacaoDelaunayScreen from "@pages/exercicios/TriangulacaoDelaunay";
import TriangulacaoDelaunayScreenConvexo from "@pages/exercicios/TriangulacaoDelaunayConvexo";
import TriangulacaoPoligonoScreen from "@pages/exercicios/TriangulacaoPoligono";

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
        },
        {
            component: TriangulacaoPoligonoScreen,
            title: 'Triangulação de polígono',
            url: '/exercicios/triangulacao-poligono'
        },
        {
            component: RepresentacaoMalhaTriangulos,
            title: 'Representação malha de triângulos (Grafo dual)',
            url: '/exercicios/representacao-malha-triangulos'
        },
        {
            component: ProjetorBilinear,
            title: 'Projetor bilinear (Malha de quadriláteros)',
            url: '/exercicios/projetor-bilinear-quadrilateros'
        }
    ]
},
{
    title: 'Trabalhos',
    entries: [
        {
            component: FechoConvexoScreen,
            title: 'Fecho convexo',
            url: '/trabalhos/fecho-convexo'
        },
        {
            component: TriangulacaoDelaunayScreen,
            title: 'Triangulação Delaunay',
            url: '/trabalhos/triangulacao-delaunay'
        },
        {
            component: TriangulacaoDelaunayScreenConvexo,
            title: 'Triangulação Delaunay (convexo)',
            url: '/trabalhos/triangulacao-delaunay-convexo'
        },
        {
            component: DiagramaVoronoiScreen,
            title: 'Diagrama Voronoi',
            url: '/trabalhos/diagrama-voronoi'
        },
        {
            component: DiagramaVoronoi2dScreen,
            title: 'Diagrama Voronoi (Relaxamento)',
            url: '/trabalhos/diagrama-voronoi-relaxamento'
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
                        <H3 className={`text-base text-gray-700 mb-4`}>{section.title}</H3>
                        {section.entries.map(entry => (
                            <List key={entry.url} className="my-1 block">
                                <MyLink href={entry.url}>{entry.title}</MyLink>
                            </List>
                        ))}
                        <Separator className="my-4" />
                    </div>
                ))
            }
        </DisciplineCard>
    )
}