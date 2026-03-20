import { Invoice, Totals } from '@/type'
import confetti from 'canvas-confetti'
import html2canvas from 'html2canvas-pro'
import jsPDF from 'jspdf'
import { Layers, Download, Eye, MessageCircle } from 'lucide-react' // Ajout de MessageCircle
import React, { useRef, useState } from 'react'

interface FacturePDFProps {
    invoice: Invoice
    totals: Totals
}

interface FactureContentProps {
    invoice: Invoice
    totals: Totals
    formatDate: (dateString: string) => string
    isDesktop?: boolean
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
}

const FactureContent: React.FC<FactureContentProps> = ({ invoice, totals, formatDate, isDesktop = false }) => {
    if (isDesktop) {
        return (
            <>
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
                        <p className='badge badge-ghost'>
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
                            {invoice.lines && invoice.lines.length > 0 ? (
                                invoice.lines.map((ligne: { description: string; quantity: number; unitPrice: number }, index: number) => (
                                    <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>{ligne.description}</td>
                                        <td>{ligne.quantity}</td>
                                        <td>{ligne.unitPrice.toFixed(2)} FCFA</td>
                                        <td>{(ligne.quantity * ligne.unitPrice).toFixed(2)} FCFA</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-center">Aucune ligne de facture</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className='mt-6 space-y-2 text-md'>
                    <div className='flex justify-between'>
                        <span className='font-bold'>Total Hors Taxes</span>
                        <span>{totals.totalHT.toFixed(2)} FCFA</span>
                    </div>

                    {invoice.vatActive && (
                        <div className='flex justify-between'>
                            <span className='font-bold'>TVA {invoice.vatRate} %</span>
                            <span>{totals.totalVAT.toFixed(2)} FCFA</span>
                        </div>
                    )}

                    <div className='flex justify-between border-t pt-2 mt-2'>
                        <span className='font-bold'>Total TTC</span>
                        <span className='badge badge-accent badge-lg'>
                            {totals.totalTTC.toFixed(2)} FCFA
                        </span>
                    </div>
                </div>
            </>
        )
    }

    // Version mobile
    return (
        <>
            <div className='flex flex-col space-y-4'>
                <div className='flex justify-between items-start'>
                    <div className='flex flex-col'>
                        <div className='flex items-center'>
                            <div className='bg-accent-content text-accent rounded-full p-1.5'>
                                <Layers className='h-5 w-5' />
                            </div>
                            <span className='ml-2 font-bold text-xl italic'>
                                Mon<span className='text-accent'>ity</span>
                            </span>
                        </div>
                        <h1 className='text-3xl font-bold uppercase mt-1'>Facture</h1>
                    </div>
                    <div className='text-right text-xs'>
                        <p className='badge badge-ghost badge-sm'>
                            N° {invoice.id}
                        </p>
                    </div>
                </div>
                
                <div className='flex justify-between text-xs bg-gray-50 p-2 rounded'>
                    <p>
                        <span className='font-bold'>Date:</span> {formatDate(invoice.invoiceDate)}
                    </p>
                    <p>
                        <span className='font-bold'>Échéance:</span> {formatDate(invoice.dueDate)}
                    </p>
                </div>
            </div>

            <div className='my-4 space-y-3'>
                <div className='bg-gray-50 p-2 rounded'>
                    <p className='badge badge-ghost badge-xs mb-1'>Émetteur</p>
                    <p className='text-xs font-bold italic'>{invoice.issuerName}</p>
                    <p className='text-xs text-gray-500 break-words'>{invoice.issuerAddress}</p>
                </div>
                <div className='bg-gray-50 p-2 rounded'>
                    <p className='badge badge-ghost badge-xs mb-1'>Client</p>
                    <p className='text-xs font-bold italic'>{invoice.clientName}</p>
                    <p className='text-xs text-gray-500 break-words'>{invoice.clientAddress}</p>
                </div>
            </div>

            <div className='overflow-x-auto -mx-4 px-4'>
                <table className='table table-zebra table-xs'>
                    <thead>
                        <tr>
                            <th className='text-xs'>#</th>
                            <th className='text-xs'>Description</th>
                            <th className='text-xs text-right'>Qté</th>
                            <th className='text-xs text-right'>P.U</th>
                            <th className='text-xs text-right'>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.lines && invoice.lines.length > 0 ? (
                            invoice.lines.map((ligne: { description: string; quantity: number; unitPrice: number }, index: number) => (
                                <tr key={index} className='text-xs'>
                                    <td>{index + 1}</td>
                                    <td className='max-w-[100px] truncate' title={ligne.description}>
                                        {ligne.description}
                                    </td>
                                    <td className='text-right'>{ligne.quantity}</td>
                                    <td className='text-right'>{ligne.unitPrice.toFixed(0)}</td>
                                    <td className='text-right font-medium'>
                                        {(ligne.quantity * ligne.unitPrice).toFixed(0)}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="text-center text-xs">Aucune ligne</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className='mt-4 space-y-1.5 text-sm border-t pt-3'>
                <div className='flex justify-between text-xs'>
                    <span>Total HT</span>
                    <span className='font-medium'>{totals.totalHT.toFixed(0)} FCFA</span>
                </div>

                {invoice.vatActive && (
                    <div className='flex justify-between text-xs'>
                        <span>TVA {invoice.vatRate}%</span>
                        <span className='font-medium'>{totals.totalVAT.toFixed(0)} FCFA</span>
                    </div>
                )}

                <div className='flex justify-between text-sm font-bold mt-2 pt-1 border-t'>
                    <span>Total TTC</span>
                    <span className='badge badge-accent badge-sm'>
                        {totals.totalTTC.toFixed(0)} FCFA
                    </span>
                </div>
            </div>
        </>
    )
}

const InvoicePDF: React.FC<FacturePDFProps> = ({ invoice, totals }) => {

    const mobileFactureRef = useRef<HTMLDivElement>(null)
    const desktopFactureRef = useRef<HTMLDivElement>(null)
    const [isGenerating, setIsGenerating] = useState<boolean>(false)
    const [isViewMode, setIsViewMode] = useState<boolean>(false)
    const [isSharing, setIsSharing] = useState<boolean>(false) // Nouvel état pour le partage

    const generatePDF = async (): Promise<jsPDF | null> => {
        const isMobile = window.innerWidth < 1024
        const element = isMobile ? mobileFactureRef.current : desktopFactureRef.current
        
        if (!element) {
            throw new Error("Élément non trouvé")
        }

        // Obtenir les dimensions réelles de l'élément
        const originalHeight = element.scrollHeight
        const originalWidth = element.scrollWidth
        const originalOverflow = element.style.overflow
        const originalMaxHeight = element.style.maxHeight

        // Forcer l'affichage complet sans défilement
        element.style.overflow = 'visible'
        element.style.maxHeight = 'none'
        element.style.height = 'auto'

        try {
            const canvas = await html2canvas(element, { 
                scale: 2,
                useCORS: true,
                logging: false,
                allowTaint: false,
                backgroundColor: '#ffffff',
                windowWidth: isMobile ? Math.max(375, originalWidth) : Math.max(1200, originalWidth),
                windowHeight: originalHeight,
                height: originalHeight,
                onclone: (clonedDoc: Document, clonedElement: HTMLElement) => {
                    clonedElement.style.display = 'block'
                    clonedElement.style.overflow = 'visible'
                    clonedElement.style.maxHeight = 'none'
                    clonedElement.style.height = 'auto'
                }
            })
            
            const imgData = canvas.toDataURL('image/png', 1.0)

            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "A4"
            })

            const pdfWidth = pdf.internal.pageSize.getWidth()
            
            // Calculer la hauteur du PDF proportionnellement à la largeur
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width

            // Si la hauteur dépasse la page A4, on crée plusieurs pages
            let heightLeft = pdfHeight
            let position = 0

            // Ajouter la première page
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST')
            
            // Si l'image est plus haute qu'une page, on ajoute des pages supplémentaires
            while (heightLeft > pdf.internal.pageSize.getHeight()) {
                position = position - pdf.internal.pageSize.getHeight()
                pdf.addPage()
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST')
                heightLeft -= pdf.internal.pageSize.getHeight()
            }
            
            return pdf
        } finally {
            // Restaurer les styles originaux
            element.style.overflow = originalOverflow
            element.style.maxHeight = originalMaxHeight
            element.style.height = ''
        }
    }

    const handleDownloadPdf = async (): Promise<void> => {
        if (isGenerating) return
        
        try {
            setIsGenerating(true)
            const pdf = await generatePDF()
            if (pdf) {
                pdf.save(`facture-${invoice.name || invoice.id}.pdf`)
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    zIndex: 9999
                })
            }
        } catch (error) {
            console.error('Erreur lors de la génération du PDF :', error);
            alert('Une erreur est survenue lors de la génération du PDF');
        } finally {
            setIsGenerating(false)
        }
    }

    const handleViewPdf = async (): Promise<void> => {
        if (isGenerating) return
        
        try {
            setIsGenerating(true)
            const pdf = await generatePDF()
            if (pdf) {
                const pdfBlob = pdf.output('blob')
                const pdfUrl = URL.createObjectURL(pdfBlob)
                window.open(pdfUrl, '_blank')
                setTimeout(() => URL.revokeObjectURL(pdfUrl), 100)
            }
        } catch (error) {
            console.error('Erreur lors de la génération du PDF :', error);
            alert('Une erreur est survenue lors de la génération du PDF');
        } finally {
            setIsGenerating(false)
        }
    }

    const handleShareWhatsApp = async (): Promise<void> => {
        if (isGenerating || isSharing) return
        
        try {
            setIsSharing(true)
            const pdf = await generatePDF()
            if (pdf) {
                const pdfBlob = pdf.output('blob')
                const pdfFile = new File([pdfBlob], `facture-${invoice.name || invoice.id}.pdf`, { type: 'application/pdf' })
                
                // Vérifier si l'API Web Share est disponible
                if (navigator.share && navigator.canShare({ files: [pdfFile] })) {
                    try {
                        await navigator.share({
                            title: `Facture ${invoice.name || invoice.id}`,
                            text: `Voici la facture ${invoice.name || invoice.id} de ${invoice.issuerName}`,
                            files: [pdfFile]
                        })
                    } catch (shareError) {
                        // Fallback si l'utilisateur annule ou si le partage échoue
                        console.log('Partage annulé ou non supporté')
                        fallbackWhatsApp()
                    }
                } else {
                    // Fallback pour les navigateurs qui ne supportent pas Web Share
                    fallbackWhatsApp()
                }
            }
        } catch (error) {
            console.error('Erreur lors du partage WhatsApp :', error);
            fallbackWhatsApp()
        } finally {
            setIsSharing(false)
        }
    }

    const fallbackWhatsApp = (): void => {
        // Message par défaut pour WhatsApp
        const message = encodeURIComponent(
            `Bonjour,\n\nJe vous envoie la facture ${invoice.name || invoice.id} d'un montant de ${totals.totalTTC.toFixed(0)} FCFA.\n\nCordialement, ${invoice.issuerName}`
        )
        
        // Ouvrir WhatsApp Web ou l'application mobile
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
        const whatsappUrl = isMobile
            ? `whatsapp://send?text=${message}`
            : `https://web.whatsapp.com/send?text=${message}`
        
        window.open(whatsappUrl, '_blank')
        
        // Informer l'utilisateur
        alert('Le PDF a été généré. Veuillez le joindre manuellement à votre conversation WhatsApp.')
    }

    const toggleViewMode = (): void => {
        setIsViewMode(!isViewMode)
    }

    return (
    <>
        {/* Version mobile */}
        <div className='mt-4 block lg:hidden'>
            <div className='border-base-300 border-2 border-dashed rounded-xl p-4'>
                {/* Barre d'outils mobile */}
                <div className='flex flex-wrap gap-2 mb-4'>
                    <button
                        onClick={handleDownloadPdf}
                        disabled={isGenerating}
                        className='btn btn-sm btn-accent flex-1 min-w-[120px]'>
                        <Download className="w-4 mr-1" />
                        {isGenerating ? '...' : 'Télécharger'}
                    </button>
                    <button
                        onClick={handleViewPdf}
                        disabled={isGenerating}
                        className='btn btn-sm btn-primary flex-1 min-w-[120px]'>
                        <Eye className="w-4 mr-1" />
                        {isGenerating ? '...' : 'Visualiser'}
                    </button>
                    <button
                        onClick={handleShareWhatsApp}
                        disabled={isGenerating || isSharing}
                        className='btn btn-sm btn-success flex-1 min-w-[120px]'
                        style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}>
                        <MessageCircle className="w-4 mr-1" />
                        {isSharing ? '...' : 'WhatsApp'}
                    </button>
                </div>

                {/* Bouton plein écran */}
                <button
                    onClick={toggleViewMode}
                    className='btn btn-xs btn-ghost w-full mb-2 text-xs'>
                    {isViewMode ? 'Réduire' : 'Voir en plein écran'}
                </button>

                {/* Mode plein écran */}
                {isViewMode ? (
                    <div className='fixed inset-0 z-50 bg-white overflow-y-auto'>
                        <div className='sticky top-0 bg-white border-b p-2 flex justify-between items-center z-10'>
                            <h2 className='font-bold'>Aperçu facture</h2>
                            <div className='flex gap-2'>
                                <button
                                    onClick={handleDownloadPdf}
                                    disabled={isGenerating}
                                    className='btn btn-xs btn-accent'>
                                    <Download className="w-3" />
                                </button>
                                <button
                                    onClick={handleShareWhatsApp}
                                    disabled={isGenerating || isSharing}
                                    className='btn btn-xs btn-success'
                                    style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}>
                                    <MessageCircle className="w-3" />
                                </button>
                                <button
                                    onClick={toggleViewMode}
                                    className='btn btn-xs btn-ghost'>
                                    ✕
                                </button>
                            </div>
                        </div>
                        <div className='p-4 bg-white' ref={mobileFactureRef}>
                            <FactureContent invoice={invoice} totals={totals} formatDate={formatDate} />
                        </div>
                    </div>
                ) : (
                    /* Mode normal (aperçu) */
                    <div className='p-4 bg-white rounded-lg max-h-[600px] overflow-y-auto' ref={mobileFactureRef}>
                        <FactureContent invoice={invoice} totals={totals} formatDate={formatDate} />
                    </div>
                )}

                <p className='text-xs text-gray-500 mt-3 text-center'>
                    💡 Le PDF généré inclura toute la facture
                </p>
            </div>
        </div>

        {/* Version desktop */}
        <div className='mt-4 hidden lg:block'>
            <div className='border-base-300 border-2 border-dashed rounded-xl p-5'>
                <div className='flex flex-wrap gap-2 mb-4'>
                    <button
                        onClick={handleDownloadPdf}
                        disabled={isGenerating}
                        className='btn btn-sm btn-accent'>
                        {isGenerating ? 'Génération...' : 'Facture PDF'}
                        <Download className="w-4" />
                    </button>
                    <button
                        onClick={handleViewPdf}
                        disabled={isGenerating}
                        className='btn btn-sm btn-primary'>
                        Visualiser
                        <Eye className="w-4" />
                    </button>
                    <button
                        onClick={handleShareWhatsApp}
                        disabled={isGenerating || isSharing}
                        className='btn btn-sm'
                        style={{ backgroundColor: '#25D366', borderColor: '#25D366', color: 'white' }}>
                        <MessageCircle className="w-4 mr-1" />
                        {isSharing ? 'Partage...' : 'WhatsApp'}
                    </button>
                </div>

                <div className='p-8 bg-white rounded-lg max-h-[800px] overflow-y-auto' ref={desktopFactureRef}>
                    <FactureContent 
                        invoice={invoice} 
                        totals={totals} 
                        formatDate={formatDate} 
                        isDesktop={true} 
                    />
                </div>

                <p className='text-sm text-gray-500 mt-4 text-center'>
                    💡 Le PDF généré inclura toute la facture
                </p>
            </div>
        </div>
    </>
)
}

export default InvoicePDF