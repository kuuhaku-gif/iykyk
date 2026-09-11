using System;

namespace Doan2.model
{
    public class TicketModel
    {
        public int TicketId { get; set; }
        public string TicketCode { get; set; }
        public int UserId { get; set; }
        public int MovieId { get; set; }
        public string MovieTitle { get; set; }
        public string CinemaRoom { get; set; }
        public DateTime Showtime { get; set; }
        public string Seats { get; set; }
        public decimal Price { get; set; }
        public string Status { get; set; } // "upcoming", "completed", "cancelled"
    }
}