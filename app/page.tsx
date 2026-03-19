"use client";

import Wrapper from "./components/Wrapper";
import { Layers } from "lucide-react";
import { useEffect, useState } from "react";
import { createEmptyInvoice, getInvoices } from "./actions"; // Changé ici !
import { useUser, SignInButton } from "@clerk/nextjs";
import confetti from "canvas-confetti";
import { Invoice } from "@/type";
import InvoiceComponent from "./components/InvoiceComponent";

export default function Home() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [invoiceName, setInvoiceName] = useState("");
  const [isNameValid, setIsNameValid] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await getInvoices(); // Plus besoin de email !
      setInvoices(data);
    } catch (error) {
      console.error("Erreur lors du chargement des factures", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchInvoices();
    } else {
      setLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    setIsNameValid(invoiceName.length <= 60);
  }, [invoiceName]);

  const handleCreateInvoice = async () => {
    try {
      if (!isSignedIn) return;
      
      await createEmptyInvoice(invoiceName); // Plus que le nom en paramètre !
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

  // État de chargement initial
  if (!isLoaded) {
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

  // Utilisateur non connecté
  if (!isSignedIn) {
    return (
      <Wrapper>
        <div className="flex flex-col justify-center items-center min-h-[60vh] text-center">
          <div className="bg-accent-content text-accent rounded-full p-4 mb-6">
            <Layers className='h-12 w-12' />
          </div>
          
          <h1 className="text-3xl font-bold mb-4">
            Bienvenue sur <span className="text-accent">InVoice</span>
          </h1>
          
          <p className="text-lg mb-8 max-w-md">
            Gérez vos factures simplement et efficacement. Connectez-vous pour commencer.
          </p>
          
          <SignInButton mode="modal">
            <button className="btn btn-accent btn-lg">
              Se connecter / S'inscrire
            </button>
          </SignInButton>
          
          <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-3xl">
            <div className="card bg-base-200 p-4">
              <div className="text-2xl mb-2">📄</div>
              <h3 className="font-bold">Créez des factures</h3>
              <p className="text-sm">En quelques clics</p>
            </div>
            <div className="card bg-base-200 p-4">
              <div className="text-2xl mb-2">📊</div>
              <h3 className="font-bold">Suivez vos paiements</h3>
              <p className="text-sm">En temps réel</p>
            </div>
            <div className="card bg-base-200 p-4">
              <div className="text-2xl mb-2">🚀</div>
              <h3 className="font-bold">Gagnez du temps</h3>
              <p className="text-sm">Automatisation</p>
            </div>
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
          <p className="text-sm text-gray-500">
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