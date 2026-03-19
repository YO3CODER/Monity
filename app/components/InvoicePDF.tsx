import { Invoice, Totals } from '@/type'
import confetti from 'canvas-confetti'
import html2canvas from 'html2canvas-pro'
import jsPDF from 'jspdf'
import { ArrowDownFromLine, Layers } from 'lucide-react'
import React, { useRef } from 'react'

interface FacturePDFProps {
    invoice: Invoice
    totals: Totals
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
}

const InvoicePDF: React.FC<FacturePDFProps> = ({ invoice, totals }) => {

    const factureRef = useRef<HTMLDivElement>(null)

    const handleDownloadPdf = async () => {
        const element = factureRef.current
        if (!element) return

        try {
            // Créer un clone de l'élément pour ne pas affecter l'affichage
            const clone = element.cloneNode(true) as HTMLElement
            clone.style.width = '800px' // Largeur fixe pour la cohérence
            clone.style.position = 'absolute'
            clone.style.left = '-9999px'
            document.body.appendChild(clone)

            // Configuration du PDF
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "px",
                format: "a4"
            })

            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = pdf.internal.pageSize.getHeight()

            // Séparer le contenu en sections
            const headerSection = clone.querySelector('.flex.justify-between.items-center') as HTMLElement
            const infoSection = clone.querySelector('.my-6.flex.justify-between') as HTMLElement
            const tableSection = clone.querySelector('.overflow-x-auto') as HTMLElement
            const totalsSection = clone.querySelector('.mt-6.space-y-2') as HTMLElement

            let yOffset = 0
            let currentPage = 1

            // Fonction pour ajouter une section au PDF
            const addSection = async (section: HTMLElement, sectionName: string) => {
                if (!section) return 0

                // Cacher temporairement les autres sections
                const sections = [headerSection, infoSection, tableSection, totalsSection]
                sections.forEach(s => { if (s) s.style.display = 'none' })
                section.style.display = 'block'

                // Capturer la section
                const canvas = await html2canvas(section, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff'
                })

                // Restaurer l'affichage
                sections.forEach(s => { if (s) s.style.display = '' })

                const imgData = canvas.toDataURL('image/png')
                const imgWidth = pdfWidth - 40 // Marge de 20px de chaque côté
                const imgHeight = (canvas.height * imgWidth) / canvas.width

                // Vérifier si la section tient sur la page courante
                if (yOffset + imgHeight > pdfHeight) {
                    pdf.addPage()
                    currentPage++
                    yOffset = 20 // Marge en haut de la nouvelle page
                }

                // Ajouter l'image au PDF
                pdf.addImage(imgData, 'PNG', 20, yOffset, imgWidth, imgHeight)
                yOffset += imgHeight + 10 // Espace entre les sections

                return imgHeight
            }

            // Ajouter toutes les sections dans l'ordre
            await addSection(headerSection, 'header')
            await addSection(infoSection, 'info')

            // Traitement spécial pour le tableau (peut être long)
            if (tableSection) {
                const tableClone = tableSection.cloneNode(true) as HTMLElement
                const tbody = tableClone.querySelector('tbody')
                const thead = tableClone.querySelector('thead')
                
                if (tbody && thead) {
                    const rows = Array.from(tbody.querySelectorAll('tr'))
                    const rowsPerPage = 15 // Ajustez selon vos besoins
                    
                    for (let i = 0; i < rows.length; i += rowsPerPage) {
                        // Créer un tableau temporaire avec un groupe de lignes
                        const tempTable = document.createElement('div')
                        tempTable.innerHTML = `
                            <div class="overflow-x-auto">
                                <table class="table table-zebra">
                                    <thead>${thead.outerHTML}</thead>
                                    <tbody>
                                        ${rows.slice(i, i + rowsPerPage).map(row => row.outerHTML).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `
                        
                        tempTable.style.width = '800px'
                        tempTable.style.position = 'absolute'
                        tempTable.style.left = '-9999px'
                        document.body.appendChild(tempTable)

                        const canvas = await html2canvas(tempTable, {
                            scale: 2,
                            useCORS: true,
                            backgroundColor: '#ffffff'
                        })

                        document.body.removeChild(tempTable)

                        const imgData = canvas.toDataURL('image/png')
                        const imgWidth = pdfWidth - 40
                        const imgHeight = (canvas.height * imgWidth) / canvas.width

                        // Nouvelle page si nécessaire
                        if (yOffset + imgHeight > pdfHeight) {
                            pdf.addPage()
                            currentPage++
                            yOffset = 20
                        }

                        pdf.addImage(imgData, 'PNG', 20, yOffset, imgWidth, imgHeight)
                        yOffset += imgHeight + 10
                    }
                }
            }

            // Ajouter la section des totaux
            await addSection(totalsSection, 'totals')

            // Nettoyer le clone
            document.body.removeChild(clone)

            // Sauvegarder le PDF
            pdf.save(`facture-${invoice.name}.pdf`)

            // Lancer les confettis
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                zIndex: 9999
            })

        } catch (error) {
            console.error('Erreur lors de la génération du PDF :', error);
        }
    }

    return (
        <div className='mt-4 hidden lg:block'>
            <div className='border-base-300 border-2 border-dashed rounded-xl p-5'>

                <button
                    onClick={handleDownloadPdf}
                    className='btn btn-sm btn-accent mb-4'>
                    Facture PDF
                    <ArrowDownFromLine className="w-4" />
                </button>

                <div className='p-8' ref={factureRef}>

                    <div className='flex justify-between items-center text-sm'>
                        <div className='flex flex-col'>
                            <div>
                                <div className='flex items-center'>

                                    <div className='bg-accent-content text-accent rounded-full p-2'>
                                        <Layers className='h-6 w-6' />
                                    </div>
                                    <span className='ml-3 font-bold text-2xl italic'>
                                        Mon<span className='text-accent'>ity</span>
                                    </span>
                                </div>
                            </div>
                            <h1 className='text-7xl font-bold uppercase'>Facture</h1>
                        </div>
                        <div className='text-right uppercase'>
                            <p className='badge badge-ghost '>
                                Facture ° {invoice.id}
                            </p>
                            <p className='my-2'>
                                <strong>Date </strong>
                                {formatDate(invoice.invoiceDate)}
                            </p>
                            <p>
                                <strong>Date d&apos;échéance </strong>
                                {formatDate(invoice.dueDate)}
                            </p>
                        </div>

                    </div>

                    <div className='my-6 flex justify-between'>
                        <div>
                            <p className='badge badge-ghost mb-2'>Émetteur</p>
                            <p className='text-sm font-bold italic'>{invoice.issuerName}</p>
                            <p className='text-sm text-gray-500 w-52 break-words'>{invoice.issuerAddress}</p>
                        </div>
                        <div className='text-right'>
                            <p className='badge badge-ghost mb-2'>Client</p>
                            <p className='text-sm font-bold italic'>{invoice.clientName}</p>
                            <p className='text-sm text-gray-500 w-52 break-words'>{invoice.clientAddress}</p>
                        </div>
                    </div>

                    <div className='overflow-x-auto'>
                        <table className='table table-zebra'>
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>Description</th>
                                    <th>Quantité</th>
                                    <th>Prix Unitaire</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.lines.map((ligne, index) => (
                                    <tr key={index + 1}>
                                        <td>{index + 1}</td>
                                        <td>{ligne.description}</td>
                                        <td>{ligne.quantity}</td>
                                        <td>{ligne.unitPrice.toFixed(2)} FCFA</td>
                                        <td>{(ligne.quantity * ligne.unitPrice).toFixed(2)} FCFA</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className='mt-6 space-y-2 text-md'>
                        <div className='flex justify-between'>
                            <div className='font-bold'>
                                Total Hors Taxes
                            </div>
                            <div>
                                {totals.totalHT.toFixed(2)} FCFA
                            </div>
                        </div>

                        {invoice.vatActive && (
                            <div className='flex justify-between'>
                                <div className='font-bold'>
                                    TVA {invoice.vatRate} %
                                </div>
                                <div>
                                    {totals.totalVAT.toFixed(2)} FCFA
                                </div>
                            </div>
                        )}

                        <div className='flex justify-between'>
                            <div className='font-bold'>
                                Total Toutes Taxes Comprises
                            </div>
                            <div className='badge badge-accent'>
                                {totals.totalTTC.toFixed(2)} FCFA
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default InvoicePDF