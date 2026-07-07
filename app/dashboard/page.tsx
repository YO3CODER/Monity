"use client";

import Wrapper from "../components/Wrapper";
import { Layers } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createEmptyInvoice, getInvoices } from "../actions";
import { useUser } from "@clerk/nextjs";
import confetti from "canvas-confetti";
import { Invoice } from "@/type";
import InvoiceComponent from "../components/InvoiceComponent";

export default function DashboardPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  const [invoiceName, setInvoiceName] = useState("");
  const [isNameValid, setIsNameValid] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await getInvoices();
      setInvoices(data);
    } catch (error) {
      console.error("Erreur lors du chargement des factures", error);
    } finally {
      setLoading(false);
    }
  };

  // Redirige vers la landing page si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/");
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (isSignedIn) {
      fetchInvoices();
    }
  }, [isSignedIn]);

  useEffect(() => {
    setIsNameValid(invoiceName.length <= 60);
  }, [invoiceName]);

  const handleCreateInvoice = async () => {
    try {
      if (!isSignedIn) return;

      await createEmptyInvoice(invoiceName);
      await fetchInvoices();
      setInvoiceName("");

      const modal = document.getElementById('my_modal_3') as HTMLDialogElement;
      if (modal) modal.close();

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        zIndex: 9999
      });
    } catch (error) {
      console.error("Erreur lors de la création de la facture :", error);
    }
  };

  // État de chargement initial, ou redirection en cours pour un visiteur non connecté
  if (!isLoaded || !isSignedIn) {
    return (
      <Wrapper>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <span className="loading loading-spinner loading-lg text-accent"></span>
            <p className="mt-4">Chargement...</p>
          </div>
        </div>
      </Wrapper>
    );
  }

  // Utilisateur connecté - Affichage des factures
  return (
    <Wrapper>
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-bold  text-emerald-500">Mes factures</h1>
          <p className="hidden sm:block text-sm text-gray-500">
            {user?.emailAddresses[0]?.emailAddress}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Bouton de création */}
          <div
            className="cursor-pointer border border-accent rounded-xl flex flex-col justify-center items-center p-5 hover:bg-accent/5 transition-colors"
            onClick={() => (document.getElementById('my_modal_3') as HTMLDialogElement).showModal()}
          >
            <div className="font-bold text-accent">
              Créer une facture
            </div>
            <div className='bg-accent-content text-accent rounded-full p-2 mt-2'>
              <Layers className='h-6 w-6' />
            </div>
          </div>

          {/* Liste des factures */}
          {loading ? (
            <div className="col-span-2 flex justify-center py-8">
              <span className="loading loading-spinner loading-md text-accent"></span>
            </div>
          ) : invoices.length > 0 ? (
            invoices.map((invoice) => (
              <div key={invoice.id}>
                <InvoiceComponent invoice={invoice} index={invoices.indexOf(invoice)} />
              </div>
            ))
          ) : (
            <div className="col-span-2 text-gray-500 py-8 text-center">
              Aucune facture pour le moment.
              <button
                className="link link-accent ml-2"
                onClick={() => (document.getElementById('my_modal_3') as HTMLDialogElement).showModal()}
              >
                Créez votre première facture
              </button>
            </div>
          )}
        </div>

        {/* Modal de création */}
        <dialog id="my_modal_3" className="modal">
          <div className="modal-box">
            <form method="dialog">
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            </form>

            <h3 className="font-bold text-lg">Nouvelle Facture</h3>

            <input
              type="text"
              placeholder="Nom de la facture (max 60 caractères)"
              className="input input-bordered w-full my-4"
              value={invoiceName}
              onChange={(e) => setInvoiceName(e.target.value)}
              maxLength={60}
            />

            {!isNameValid && (
              <p className="mb-4 text-sm text-error">
                Le nom ne peut pas dépasser 60 caractères.
              </p>
            )}

            <button
              className="btn btn-accent"
              disabled={!isNameValid || invoiceName.length === 0}
              onClick={handleCreateInvoice}
            >
              Créer
            </button>
          </div>
        </dialog>
      </div>
    </Wrapper> 
  );
}